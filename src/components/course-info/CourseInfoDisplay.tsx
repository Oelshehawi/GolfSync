import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudFog,
  CloudSnow,
  CloudDrizzle,
  Thermometer,
  Droplets,
} from "lucide-react";

// Weather icon mapping
const weatherIcons: Record<string, React.ReactNode> = {
  Fair: <Sun className="h-5 w-5 text-yellow-500" />,
  "Light Rain": <CloudDrizzle className="h-5 w-5 text-blue-400" />,
  Lightning: <CloudLightning className="h-5 w-5 text-yellow-400" />,
  "Mostly Cloudy": <CloudFog className="h-5 w-5 text-gray-500" />,
  Overcast: <Cloud className="h-5 w-5 text-gray-600" />,
  "Partly Cloudy": <Cloud className="h-5 w-5 text-gray-400" />,
  Raining: <CloudRain className="h-5 w-5 text-blue-500" />,
  "Scattered Showers": <CloudDrizzle className="h-5 w-5 text-blue-400" />,
  Snow: <CloudSnow className="h-5 w-5 text-blue-100" />,
  Sunny: <Sun className="h-5 w-5 text-yellow-500" />,
};

type CourseInfoDisplayProps = {
  data: {
    weatherStatus?: string | null;
    forecast?: string | null;
    rainfall?: string | null;
    notes?: string | null;
  };
};

function formatTemperature(forecast: string): string {
  // Remove any existing degree symbols and 'C' to clean the string
  const cleanForecast = forecast.replace(/[°℃C]/g, "").trim();

  // Try to extract the number
  const match = /(-?\d+)/.exec(cleanForecast);
  if (match) {
    const temperature = match[1];
    return `${temperature}°C`;
  }

  // If no number found, return original with °C
  return `${forecast}°C`;
}

export function CourseInfoDisplay({ data }: CourseInfoDisplayProps) {
  if (!data) return null;

  const { weatherStatus, forecast, rainfall, notes } = data;

  // Format the forecast if it exists
  const formattedForecast = forecast ? formatTemperature(forecast) : null;

  return (
    <div className="w-full rounded-lg bg-white p-4 shadow-md">
      {/* Weather Status Section */}
      {weatherStatus && (
        <div className="mb-4 flex flex-wrap items-center gap-4 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 rounded-full bg-gray-50 px-3 py-2">
            {weatherIcons[weatherStatus] || (
              <Cloud className="h-5 w-5 text-gray-500" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {weatherStatus}
            </span>
          </div>

          {formattedForecast && (
            <div className="flex items-center gap-2 rounded-full bg-gray-50 px-3 py-2">
              <Thermometer className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-gray-700">
                {formattedForecast}
              </span>
            </div>
          )}

          {rainfall && (
            <div className="flex items-center gap-2 rounded-full bg-gray-50 px-3 py-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                {rainfall.toLowerCase().includes("rainfall")
                  ? rainfall
                  : `24 Hour Rainfall Total: ${rainfall}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Course Notes */}
      {notes && (
        <div className="rounded-md bg-gray-50 p-3">
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: notes }}
          />
        </div>
      )}
    </div>
  );
}
