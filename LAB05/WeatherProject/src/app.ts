import "dotenv/config";
import express, { Request, response, Response } from "express";
import { freemem } from "os";
import path from "path";
const app = express();
const port = 3000;
app.use(express.static(path.join(__dirname, "../public")));
type WeatherResp = {
  coord: { lon: number; lat: number };
  main: { temp: number };
  weather: { description: string; icon: string }[];
};
type PollutionResp = {
  list: {
    main: { aqi: number };
    components: { pm2_5: number; pm10: number };
  }[];
};
app.get("/api/weather", async (req: Request, res: Response) => {
  const city = (req.query.city as string) || "London";
  const appKey = process.env.OPENWEATHER_KEY;
  if (!appKey)
    return res.status(500).json({ message: "MissingOPENWEATHER_KEY" });
  try {
    // 1. Call Weather endpoint to get temp, description, icon, and lat/lon
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${appKey}`;
    const response = await fetch(weatherUrl);
    if (!response.ok) throw new Error("Weather API response error");

    const weatherData: WeatherResp = await response.json();

    // 2. Extract values from weather response
    const { coord, main, weather } = weatherData;
    const temp = main.temp;
    const desc = weather[0].description;
    const icon = weatherData.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    // 3. Call Air pollution endpoint using lat/lon
    const pollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coord.lat}&lon=${coord.lon}&appid=${appKey}`;
    const pollutionResp = await fetch(pollutionUrl);
    if (!pollutionResp.ok) throw new Error("Air Pollution API response error");
    const pollutionData: PollutionResp = await pollutionResp.json();

    // 4. Extract air quality values
    const pm25 = pollutionData.list[0].components.pm2_5;
    const pm10 = pollutionData.list[0].components.pm10;
    const aqi = pollutionData.list[0].main.aqi;
    // 5. Return JSON in the required format
    res.json({
      city,
      temp,
      desc,
      iconUrl,
      aqi,
      pm25,
      pm10
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching weather data" });
  }
});
app.listen(port, () => console.log(`http://localhost:${port}/api/weather?city=london`));