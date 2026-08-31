import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { getActiveSession, scanEnvelope, EnvelopeScanResult } from '../../lib/usher'
import { toast } from '../../components/Toast'
import { playScanSuccess, playScanError, initSound } from '../../lib/sound'

function extractToken(text: string): string {
  return text.trim()
}

export default function UsherScanPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const qrContainerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [verified, setVerified] = useState<EnvelopeScanResult | null>(null)
  const [alreadyRecorded, setAlreadyRecorded] = useState<EnvelopeScanResult | null>(null)
  const [error, setError] = useState('')
  const sessionRef = useRef<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    getActiveSession().then((s) => {
      sessionRef.current = s?.name ?? null
      sessionIdRef.current = s?.id ?? null
    })
  }, [])

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch {
        /* ignore */
      }
      try {
        scannerRef.current.clear()
      } catch {
        /* ignore */
      }
      scannerRef.current = null
    }
    setCameraActive(false)
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startCamera = async () => {
    setError('')
    setScanning(true)
    initSound()
    try {
      // Show the container BEFORE the scanner starts so the video gets real
      // dimensions on mobile (html5-qrcode sizes to its container).
      setCameraActive(true)
      await new Promise((resolve) => setTimeout(resolve, 50))
      if (!qrContainerRef.current) return
      const scanner = new Html5Qrcode('usher-reader-region')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 }
        },
        async (decodedText) => {
          // Pause on first successful read to prevent multiple scans
          await stopScanner()
          const token = extractToken(decodedText)
          const sessionId = sessionIdRef.current
          setScanning(true)
          const outcome = await scanEnvelope(token, sessionId)
          setScanning(false)
          if (outcome.kind === 'ok') {
            playScanSuccess()
            setVerified(outcome.result)
          } else if (outcome.kind === 'already-recorded') {
            playScanError()
            setAlreadyRecorded(outcome.result)
            toast(outcome.message, 'error')
          } else {
            playScanError()
            setError(outcome.message)
            toast(outcome.message, 'error')
            // allow re-scan after a short delay
            setTimeout(() => {
              if (!verified && !alreadyRecorded) startCamera()
            }, 1500)
          }
        },
        () => {
          /* intermediate decode callback - ignore */
        }
      )
      setCameraActive(true)
      playScanSuccess()
    } catch (e) {
      const msg =
        e instanceof Error && e.message ? e.message : 'Unable to access the camera.'
      setError(msg)
      toast('Camera permission is required to scan QR codes.', 'error')
      setScanning(false)
      setCameraActive(false)
    }
  }

  const goToRecordFor = (result: EnvelopeScanResult) => {
    navigate('/usher/record', {
      state: {
        envelopeId: result.envelopeId,
        envelopeCode: result.code,
        previousMemberName: result.previousMemberName,
        hasHistory: result.hasHistory
      }
    })
  }

  const goToRecord = () => {
    if (!verified) return
    goToRecordFor(verified)
  }

  const resetAll = () => {
    setVerified(null)
    setAlreadyRecorded(null)
    setError('')
  }

  // QR code can also come via URL (e.g. manual entry fallback on desktop)
  const queryToken =
    (location.state as { qrToken?: string } | null)?.qrToken ??
    new URLSearchParams(location.search).get('qr') ??
    null

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Scan Envelope QR</h2>
          {sessionRef.current && (
            <span className="text-xs text-slate-500">{sessionRef.current}</span>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Point the camera at the envelope QR code.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
          <button onClick={startCamera} className="block text-xs underline mt-1">
            Try again
          </button>
        </div>
      )}

      {!verified && !alreadyRecorded && (
        <>
          {!cameraActive && !scanning && (
            <button onClick={startCamera} className="btn-primary w-full !py-5 !text-lg gap-2">
              Start Camera
            </button>
          )}
          {scanning && (
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm text-slate-500">Verifying envelope...</div>
            </div>
          )}
          <div
            id="usher-reader-region"
            ref={qrContainerRef}
            className={`mx-auto rounded-lg overflow-hidden bg-black ${
              cameraActive ? 'block' : 'hidden'
            }`}
            style={{ width: '100%', minHeight: cameraActive ? '280px' : 0 }}
          />
          {cameraActive && (
            <div className="text-center">
              <button
                onClick={async () => {
                  await stopScanner()
                  setError('')
                }}
                className="btn-secondary w-full"
              >
                Stop Camera
              </button>
            </div>
          )}
          {queryToken && (
            <button
              onClick={async () => {
                const sessionId = sessionIdRef.current
                const outcome = await scanEnvelope(queryToken, sessionId)
                if (outcome.kind === 'ok') setVerified(outcome.result)
                else if (outcome.kind === 'already-recorded') {
                  setAlreadyRecorded(outcome.result)
                  toast(outcome.message, 'error')
                } else {
                  setError(outcome.message)
                }
              }}
              className="btn-secondary w-full"
            >
              Use QR from link
            </button>
          )}
          <Link to="/usher" className="block text-center text-sm text-brand-700 underline">
            ← Back
          </Link>
        </>
      )}

      {verified && (
        <div className="card p-6 text-center">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-lg font-bold text-emerald-600">ENVELOPE VERIFIED</div>
          <div className="mt-3 bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-500 uppercase">Envelope Code</div>
            <div className="text-xl font-mono font-bold text-slate-800">{verified.code}</div>
          </div>
          {verified.hasHistory && verified.previousMemberName && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
              <div className="text-xs text-amber-700 font-semibold">PREVIOUS RECORD FOUND</div>
              <div className="text-sm text-amber-800">
                Previous name: <span className="font-semibold">{verified.previousMemberName}</span>
              </div>
            </div>
          )}
          <button onClick={goToRecord} className="btn-primary w-full !py-4 !text-base mt-4">
            Continue to Transaction →
          </button>
          <button onClick={resetAll} className="btn-secondary w-full mt-2">
            Rescan
          </button>
        </div>
      )}

      {alreadyRecorded && (
        <div className="card p-6 text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="text-lg font-bold text-orange-600">ENVELOPE ALREADY RECORDED</div>
          <p className="text-sm text-slate-600 mt-2">
            This envelope has already been recorded during the current collection session.
          </p>
          <div className="mt-3 bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-500 uppercase">Envelope Code</div>
            <div className="text-xl font-mono font-bold text-slate-800">
              {alreadyRecorded.code}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            If this is a new contribution (e.g. tithes or offering given again), tap{" "}
            <span className="font-semibold">Record Again</span>. Otherwise press{" "}
            <span className="font-semibold">Scan Next Envelope</span> to avoid a duplicate.
          </p>
          <button
            onClick={() => goToRecordFor(alreadyRecorded)}
            className="btn-primary w-full !py-4 !text-base mt-4"
          >
            Record Again
          </button>
          <button onClick={resetAll} className="btn-secondary w-full mt-2">
            Scan Next Envelope
          </button>
        </div>
      )}
    </div>
  )
}
