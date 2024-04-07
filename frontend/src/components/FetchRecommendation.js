import React, { useState, useEffect } from 'react';
import { Button, Modal, Box, Typography, TextField } from '@mui/material';
import L from 'leaflet'; // Import Leaflet
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import OpenAI from "openai";

const OPENAI_API_KEY = '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';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

async function getLocation() {
  const response = await fetch("https://ipapi.co/json/");
  const locationData = await response.json();
  return locationData;
}

async function getCurrentWeather(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=apparent_temperature`;
  const response = await fetch(url);
  const weatherData = await response.json();
  return weatherData;
}

const tools = [
  {
    type: "function",
    function: {
      name: "getCurrentWeather",
      description: "Get the current weather in a given location",
      parameters: {
        type: "object",
        properties: {
          latitude: {
            type: "string",
          },
          longitude: {
            type: "string",
          },
        },
        required: ["longitude", "latitude"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "getLocation",
      description: "Get the user's location based on their IP address",
      parameters: {
        type: "object",
        properties: {},
      },
    }
  },
];
 
const availableTools = {
  getCurrentWeather,
  getLocation,
};
 
const messages = [
  {
    role: "system",
    content: `You are a helpful assistant. Only use the functions you have been provided with.`,
  },
];
 
async function agent(userInput) {
  messages.push({
    role: "user",
    content: userInput,
  });
 
  for (let i = 0; i < 5; i++) {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: messages,
      tools: tools,
    });
 
    const { finish_reason, message } = response.choices[0];
 
    if (finish_reason === "tool_calls" && message.tool_calls) {
      const functionName = message.tool_calls[0].function.name;
      const functionToCall = availableTools[functionName];
      const functionArgs = JSON.parse(message.tool_calls[0].function.arguments);
      const functionArgsArr = Object.values(functionArgs);
      const functionResponse = await functionToCall.apply(
        null,
        functionArgsArr
      );
 
      messages.push({
        role: "function",
        name: functionName,
        content: `
                The result of the last function was this: ${JSON.stringify(
                  functionResponse
                )}
                `,
      });
    } else if (finish_reason === "stop") {
      messages.push(message);
      return message.content;
    }
  }
  return "The maximum number of iterations has been met without a suitable answer. Please try again with a more specific input.";
}

const RecommendationModal = () => {
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const locationData = await getLocation();
      setCurrentLocation(locationData);
      const weatherData = await getCurrentWeather(locationData.latitude, locationData.longitude);
      setCurrentWeather(weatherData);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (open && map === null) {
const timeout = setTimeout(() => {
      initializeMap();
}, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [open, map]);

  const initializeMap = () => {
    if (!currentLocation) {
      return;
    }
  
    const map = L.map('leaflet-map').setView([currentLocation.latitude, currentLocation.longitude], 13);
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  
    L.marker([currentLocation.latitude, currentLocation.longitude]).addTo(map)
      .bindPopup('You are here.')
      .openPopup();
  
    // Add more pins
    // Add more pins within the Chicago region
const additionalPins = [
  { latitude: 41.8781, longitude: -87.6298, popupContent: 'Chicago, IL' },
  { latitude: 41.8789, longitude: -87.6359, popupContent: 'Navy Pier, Chicago, IL' },
  { latitude: 41.8919, longitude: -87.6051, popupContent: 'Willis Tower, Chicago, IL' }
  // Add more pins as needed
];

  
    additionalPins.forEach(pin => {
      L.marker([pin.latitude, pin.longitude]).addTo(map)
        .bindPopup(pin.popupContent);
    });
  
    setMap(map);
  };
  

  const handleClickRecommendation = async () => {
    setOpen(true);
    const response = await agent(
      "Please suggest some activities based on my location and the weather."
    );
    setResponse(response);  
  };

  const handleClose = () => {
    setOpen(false);
    setMap(null);
    setResponse('');
  };

  const convertCelsiusToFahrenheit = (celsius) => {
    return (celsius * 9/5) + 32;
  };

  return (
    <>
      <Button variant="outlined" size="small" color="primary" onClick={handleClickRecommendation}>
        Recommended For You
      </Button>
      <Modal open={open} onClose={handleClose} >
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 1000, height: 700, bgcolor: 'background.paper', boxShadow: 24, p: 4, overflow: 'auto' }}>
          <Typography id="modal-modal-title" variant="h6" component= "h2">Recommended For You</Typography>
          <div
            id="leaflet-map"
            style={{ width: '100%', height: '500px' }} // Adjust height as needed
          ></div>
          <Typography variant="body1" gutterBottom>
            Current Location: {currentLocation ? `${currentLocation.city}, ${currentLocation.country_name}` : 'Loading...'}
          </Typography>
          <Typography variant="body1" gutterBottom>
          Current Weather: {currentWeather ? `${convertCelsiusToFahrenheit(currentWeather.hourly.apparent_temperature[0])}°F` : 'Loading...'}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={response ? response : "Loading Recommendation..."}
            disabled
            variant="outlined"
            sx={{ mt: 2}} 
          />
        </Box>
      </Modal>
    </>
  );
};

export default RecommendationModal;
