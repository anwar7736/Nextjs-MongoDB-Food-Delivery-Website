"use client";
import React from 'react'
export const session = (key, value = "") => 
{
    if(key && value)
    {
        return localStorage.setItem(key, JSON.stringify(value));
    }
    else{
        return localStorage.getItem(key) != null ? JSON.parse(localStorage.getItem(key)) : [];
    }
}

export const session_destroy = (key) => 
{
    if(key)
    {
        return localStorage.removeItem(key);
    }
}

const SessionHelper = () => {
  return (
    <div>Session</div>
  )
}

export default SessionHelper