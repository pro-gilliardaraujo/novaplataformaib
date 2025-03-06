import Image from "next/image";

export default function Home() {
  return (
    <main className="h-[calc(100vh)] p-4">
      <div className="h-full w-full bg-white rounded-lg shadow-sm">
        <iframe 
          src="https://www.meteoblue.com/pt/tempo/mapas/widget?windAnimation=1&gust=1&satellite=1&cloudsAndPrecipitation=1&temperature=1&sunshine=1&extremeForecastIndex=1&geoloc=detect&tempunit=C&windunit=km%252Fh&lengthunit=metric&zoom=7&autowidth=auto" 
          frameBorder="0" 
          scrolling="no" 
          allowTransparency={true}
          sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox" 
          className="w-full h-full"
        />
      </div>
    </main>
  );
}
