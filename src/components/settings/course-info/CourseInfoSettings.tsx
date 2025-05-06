"use client";
import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import toast from "react-hot-toast";
import { NotesEditor } from "./NotesEditor";

// Weather icons
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudFog,
  CloudSnow,
  CloudDrizzle,
} from "lucide-react";

// Server actions need to be directly imported in client components
import { updateCourseInfo } from "~/server/settings/actions";

type WeatherOption = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const weatherOptions: WeatherOption[] = [
  {
    id: "Fair",
    label: "Fair",
    icon: <Sun className="h-8 w-8 text-yellow-500" />,
  },
  {
    id: "Light Rain",
    label: "Light Rain",
    icon: <CloudDrizzle className="h-8 w-8 text-blue-400" />,
  },
  {
    id: "Lightning",
    label: "Lightning",
    icon: <CloudLightning className="h-8 w-8 text-yellow-400" />,
  },
  {
    id: "Mostly Cloudy",
    label: "Mostly Cloudy",
    icon: <CloudFog className="h-8 w-8 text-gray-500" />,
  },
  {
    id: "Overcast",
    label: "Overcast",
    icon: <Cloud className="h-8 w-8 text-gray-600" />,
  },
  {
    id: "Partly Cloudy",
    label: "Partly Cloudy",
    icon: <Cloud className="h-8 w-8 text-gray-400" />,
  },
  {
    id: "Raining",
    label: "Raining",
    icon: <CloudRain className="h-8 w-8 text-blue-500" />,
  },
  {
    id: "Scattered Showers",
    label: "Scattered Showers",
    icon: <CloudDrizzle className="h-8 w-8 text-blue-400" />,
  },
  {
    id: "Snow",
    label: "Snow",
    icon: <CloudSnow className="h-8 w-8 text-blue-100" />,
  },
  {
    id: "Sunny",
    label: "Sunny",
    icon: <Sun className="h-8 w-8 text-yellow-500" />,
  },
];

type CourseInfoProps = {
  initialData?: {
    id?: number;
    weatherStatus?: string;
    forecast?: string;
    rainfall?: string;
    notes?: string;
  };

};

export function CourseInfoSettings({ initialData }: CourseInfoProps) {
  const [isPending, startTransition] = useTransition();

  const [weatherStatus, setWeatherStatus] = useState(
    initialData?.weatherStatus || "",
  );
  const [forecast, setForecast] = useState(initialData?.forecast || "");
  const [rainfall, setRainfall] = useState(initialData?.rainfall || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  // Save course info
  const saveChanges = () => {
    startTransition(async () => {
      try {
        const result = await updateCourseInfo({
          weatherStatus,
          forecast,
          rainfall,
          notes,
        });

        if (result.success) {
          toast.success("Course info saved successfully");
        } else {
          toast.error(result.error || "Failed to save course info");
        }
      } catch (error) {
        toast.error("An error occurred while saving");
        console.error(error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>
            Set the current course information that will be displayed to members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weather Section */}
          <div className="space-y-4">
            <Label>Current Weather Status</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {weatherOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => setWeatherStatus(option.id)}
                  className={`hover:bg-muted flex cursor-pointer flex-col items-center justify-center rounded-lg border p-4 transition-colors ${
                    weatherStatus === option.id
                      ? "border-primary bg-primary/5 border-2"
                      : "border-border"
                  }`}
                >
                  {option.icon}
                  <span className="mt-2 text-sm">{option.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weather Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="forecast">Forecast Temperature</Label>
              <Input
                id="forecast"
                value={forecast}
                onChange={(e) => setForecast(e.target.value)}
                placeholder="e.g. 11°C"
              />
              <p className="text-muted-foreground text-sm">
                Enter the forecast temperature
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rainfall">Rainfall Total</Label>
              <Input
                id="rainfall"
                value={rainfall}
                onChange={(e) => setRainfall(e.target.value)}
                placeholder="e.g. 24 Hour Rainfall Total: 5mm"
              />
              <p className="text-muted-foreground text-sm">
                Enter the rainfall information
              </p>
            </div>
          </div>

          {/* Header Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Course Notes</Label>
            <NotesEditor value={notes} onChange={setNotes} />
            <p className="text-muted-foreground text-sm">
              Add information such as course conditions, cart rules, hours, etc.
            </p>
          </div>

          {/* Save Button */}
          <Button
            onClick={saveChanges}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
