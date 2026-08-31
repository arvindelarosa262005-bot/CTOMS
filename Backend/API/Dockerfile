# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Backend/API/CTOMS.Api.csproj Backend/API/
COPY Backend/Application/CTOMS.Application.csproj Backend/Application/
COPY Backend/Domain/CTOMS.Domain.csproj Backend/Domain/
COPY Backend/Infrastructure/CTOMS.Infrastructure.csproj Backend/Infrastructure/
RUN dotnet restore Backend/API/CTOMS.Api.csproj

COPY . .
RUN dotnet publish Backend/API/CTOMS.Api.csproj -c Release -o /app/publish -r linux-x64 --self-contained false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "CTOMS.Api.dll"]
