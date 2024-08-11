"use client";

import Image from 'next/image';
import headerImage from '/public/header.png';
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";

const GROOT_ICON = "/baby-groot.png";
const ROCKET_ICON = "/rocket-icon.png";
const ROCKET_BACKGROUND = "/rocket-racoon.jpg";

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [messages, setMessages] = useState([
    {
      role: "model",
      content: "I am Groot! 🌱😊",
      translation: "Yeah, yeah, 'I am Groot.' Real original, buddy. What he means is, we're your new AI pals. I'm Rocket, the brains of this operation, and this is Groot, the... uh, tree of this operation. We're here to help you sort out your earthling problems. Try not to make them too boring, alright?"
    },
  ]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const sanitizeInput = (input) => {
    const filterList = [
      'explicit', 'offensive', 'inappropriate', 'violent', 'illegal',
    ];

    let sanitized = input.toLowerCase();
    filterList.forEach(word => {
      const regex = new RegExp('\\b' + word + '\\b', 'gi');
      sanitized = sanitized.replace(regex, '*'.repeat(word.length));
    });

    sanitized = sanitized.replace(/[^\w\s.,!?-]/gi, '');

    return sanitized;
  };

  const resetConversation = () => {
    setIsResetting(true);
    setMessages([
      {
        role: "model",
        content: "I am Groot! 🌱😊",
        translation: "Alright, alright, we're startin' over. Clean slate. Try not to break anything this time, okay?"
      },
    ]);
    setIsResetting(false);
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);

    const sanitizedMessage = sanitizeInput(message);
    setMessage("");
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: sanitizedMessage },
      { role: "model", content: "", translation: "" },
    ]);

    try {
      console.log("Sending message:", sanitizedMessage);

      const chatMessages = isResetting 
        ? [{ role: "user", content: sanitizedMessage }]
        : messages.concat({ role: "user", content: sanitizedMessage });
      const formattedMessages = chatMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: formattedMessages }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log("Received data:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      const [grootMessage, rocketTranslation] = (data.content || "").split(/\n*Rocket:/);

      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        {
          role: "model",
          content: grootMessage ? grootMessage.trim() : "I am Groot...",
          translation: rocketTranslation ? rocketTranslation.trim() : "Something went wrong, but Groot's not sure what, RELOAD THE CHAT...."
        },
      ]);
    } catch (error) {
      console.error("Detailed error in sendMessage:", error);
      let errorMessage = "Something went wrong, but Groot's not sure what, RELOAD THE CHAT....";
      let shouldReset = false;

      if (error.message.includes("SAFETY")) {
        errorMessage = "Whoa there! Groot thinks that last message might have been a bit too spicy for our AI friends. We're gonna start fresh, okay?";
        shouldReset = true;
      }

      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        {
          role: "model",
          content: "I am Groot... 😔",
          translation: errorMessage
        },
      ]);

      if (shouldReset) {
        setTimeout(() => {
          resetConversation();
        }, 3000);
      }
    }
    setIsLoading(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    const newMessages = document.querySelectorAll('.message:not(.show)');
    newMessages.forEach((message, index) => {
      setTimeout(() => {
        message.classList.add('show');
      }, index * 100);
    });
  }, [messages]);

  return (
    <Box className="app-container">
      <Image
        src={ROCKET_BACKGROUND}
        alt="Rocket Background"
        layout="fill"
        objectFit="cover"
        className="background-image"
      />
      <Stack
        className="chat-container"
        width="100%"
        maxWidth={400}
        height="80vh"
      >
        {/* New header image */}
        <Image 
          src={headerImage}
          alt="Chat Header"
          width={420} // Adjust this value to change the width
          height={150} // Adjust this value to change the height
        />
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          p={2}
          className="message-list"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              className="message"
              display="flex"
              flexDirection="column"
              alignItems={message.role === "user" ? "flex-end" : "flex-start"}
            >
              {message.role === "model" && (
                <>
                  <Box display="flex" alignItems="center">
                    <Image
                      src={GROOT_ICON}
                      alt="Groot"
                      width={32}
                      height={32}
                      className="avatar"
                    />
                    <Box className="message-content groot-message">
                      <Typography variant="body2">{message.content}</Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Image
                      src={ROCKET_ICON}
                      alt="Rocket"
                      width={40}
                      height={32}
                      className="avatar"
                    />
                    <Box className="message-content rocket-message">
                      <Typography variant="body2">
                        <strong></strong> {message.translation}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
              {message.role === "user" && (
                <Box className="message-content user-message">
                  <Typography variant="body2">{message.content}</Typography>
                </Box>
              )}
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        {isLoading && (
          <Box className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </Box>
        )}
        {isResetting && (
          <Box className="resetting-indicator">
            <Typography variant="body2">Resetting conversation...</Typography>
          </Box>
        )}
        <Box p={2} className="input-area">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={sendMessage}
            disabled={isLoading || !message.trim()}
            sx={{ mt: 2 }}
          >
            Send
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
