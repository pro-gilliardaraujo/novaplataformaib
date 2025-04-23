import Image from "next/image";

export default function Home() {
  return (
    <main className="h-[calc(100vh)] p-4">
      <div className="h-full w-full bg-white rounded-lg shadow-sm">
        <iframe 
          width="100%" 
          height="100%" 
          src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=km/h&zoom=3&overlay=wind&product=ecmwf&level=surface&lat=-36.598&lon=-50.977&message=true" 
          frameBorder="0"
          className="w-full h-full"
        />
      </div>
    </main>
  );
} 