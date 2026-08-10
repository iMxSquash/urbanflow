export interface WeatherCondition {
  city: string
  condition: 'clear' | 'rain' | 'snow' | 'clouds' | 'thunderstorm'
  temperature: number
  humidity: number
  windSpeed: number
  description: string
  icon: string
  timestamp: string
}
