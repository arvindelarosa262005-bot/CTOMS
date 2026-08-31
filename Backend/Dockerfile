# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY API/CTOMS.Api.csproj API/
COPY Application/CTOMS.Application.csproj Application/
COPY Domain/CTOMS.Domain.csproj Domain/
COPY Infrastructure/CTOMS.Infrastructure.csproj Infrastructure/
RUN dotnet restore API/CTOMS.Api.csproj

COPY . .
RUN dotnet publish API/CTOMS.Api.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "CTOMS.Api.dll"]
