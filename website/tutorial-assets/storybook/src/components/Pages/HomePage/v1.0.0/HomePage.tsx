'use client';

import React from 'react';
import { Button } from '../../../atoms/Button';

export interface HomePageProps {}

export const HomePage: React.FC<HomePageProps> = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to Induction Studio
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          The AI-powered application development platform that transforms ideas into production-ready applications.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            variant="default"
            size="lg"
            onClick={() => window.location.href = '/auth/signin'}
          >
            Get Started
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => window.location.href = '/dashboard'}
          >
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
};