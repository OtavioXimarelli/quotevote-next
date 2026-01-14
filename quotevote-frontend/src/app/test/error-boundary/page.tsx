'use client';

import { useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';

// 1. A component that will throw an error when a button is clicked
function BuggyComponent() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('💥 Intentional error from BuggyComponent!');
  }

  return (
    <div className="p-4 border border-dashed border-gray-300 rounded-md">
      <p className="text-sm text-gray-600 mb-3">
        This is a child component. Click the button to trigger a render error.
      </p>
      <Button onClick={() => setShouldThrow(true)} variant="destructive">
        Trigger Error
      </Button>
    </div>
  );
}

// 2. A custom fallback component to display when an error is caught
function CustomErrorFallback() {
  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
      <h3 className="font-bold">Oops! A Wild Error Appeared!</h3>
      <p>Something went wrong inside this component, but the rest of the app is still running.</p>
    </div>
  );
}


// 3. The test page that uses the ErrorBoundary
export default function ErrorBoundaryTestPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">ErrorBoundary Test Page</h1>
        <p className="text-gray-500 mt-2">
          This page demonstrates how the ErrorBoundary component gracefully handles UI errors.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-4">Test Case 1: Default Fallback UI</h2>
        <p className="mb-3">
          This ErrorBoundary will use the default, beautifully styled fallback screen.
        </p>
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
          <ErrorBoundary>
            <BuggyComponent />
          </ErrorBoundary>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Test Case 2: Custom Fallback Component</h2>
        <p className="mb-3">
          This ErrorBoundary is given a custom, simpler fallback component via the `fallback` prop.
        </p>
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
          <ErrorBoundary fallback={<CustomErrorFallback />}>
            <BuggyComponent />
          </ErrorBoundary>
        </div>
      </section>

      <section className="p-4 border border-green-300 bg-green-50 rounded-md">
        <h2 className="text-xl font-semibold text-green-800">I am outside the boundary</h2>
        <p className="text-green-700 mt-2">
          This component is not wrapped in an ErrorBoundary. If an error occurs above, I should still be visible and interactive, proving the app hasn&apos;t crashed.
        </p>
      </section>
    </div>
  );
}
