'use client'

import { useState } from 'react'
import HighlightText from '@/components/HighlightText'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

/**
 * Test Page for HighlightText Component
 * 
 * This page demonstrates the HighlightText component functionality:
 * - Single match highlighting
 * - Multiple matches highlighting
 * - Case sensitivity option
 * - Auto-escape option
 * - Custom styling
 * - Edge cases (empty text, no matches, special characters)
 */
export default function HighlightTextTestPage() {
  const [text, setText] = useState(
    "The dog is chasing the cat. Or perhaps they're just playing?"
  )
  const [highlightTerm, setHighlightTerm] = useState('the')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [autoEscape, setAutoEscape] = useState(true)
  const [customClass, setCustomClass] = useState('bg-yellow-200 font-semibold')

  // Example texts for quick testing
  const exampleTexts = [
    "The dog is chasing the cat. Or perhaps they're just playing?",
    "Hello World! This is a test string with multiple words.",
    "Price: $100.00 (50% off) - Special characters test!",
    "Search results for 'react' and 'typescript' in this text.",
    "Case sensitive test: The THE the",
  ]

  const exampleTerms = [
    ['and', 'or', 'the'],
    ['Hello', 'World'],
    ['$100', '50%'],
    ['react', 'typescript'],
    ['The'],
  ]

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">HighlightText Component Test</h1>
        <p className="text-muted-foreground">
          Test page for HighlightText component. This component highlights search
          terms or key phrases within text using react-highlight-words.
        </p>
      </div>

      {/* Interactive Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text-input">Text to Highlight</Label>
            <Input
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to highlight"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="term-input">Highlight Term(s)</Label>
            <Input
              id="term-input"
              value={highlightTerm}
              onChange={(e) => setHighlightTerm(e.target.value)}
              placeholder="Enter term(s) to highlight (comma-separated for multiple)"
            />
            <p className="text-sm text-muted-foreground">
              Separate multiple terms with commas (e.g., &quot;the, and, or&quot;)
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="case-sensitive"
                checked={caseSensitive}
                onCheckedChange={(checked) =>
                  setCaseSensitive(checked === true)
                }
              />
              <Label htmlFor="case-sensitive">Case Sensitive</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-escape"
                checked={autoEscape}
                onCheckedChange={(checked) => setAutoEscape(checked === true)}
              />
              <Label htmlFor="auto-escape">Auto Escape</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class-input">Custom Highlight Class</Label>
            <Input
              id="class-input"
              value={customClass}
              onChange={(e) => setCustomClass(e.target.value)}
              placeholder="bg-yellow-200 font-semibold"
            />
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Result:</h3>
            <div className="text-base">
              <HighlightText
                text={text}
                highlightTerms={
                  highlightTerm
                    .split(',')
                    .map((t) => t.trim())
                    .filter((t) => t.length > 0)
                }
                caseSensitive={caseSensitive}
                autoEscape={autoEscape}
                highlightClassName={customClass}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Example Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Single Match */}
          <div className="space-y-2">
            <h3 className="font-semibold">1. Single Match</h3>
            <div className="p-4 bg-muted rounded-lg">
              <HighlightText
                text="Hello World"
                highlightTerms="World"
              />
            </div>
          </div>

          {/* Multiple Matches */}
          <div className="space-y-2">
            <h3 className="font-semibold">2. Multiple Matches</h3>
            <div className="p-4 bg-muted rounded-lg">
              <HighlightText
                text="The dog is chasing the cat. Or perhaps they're just playing?"
                highlightTerms={['and', 'or', 'the']}
              />
            </div>
          </div>

          {/* No Matches */}
          <div className="space-y-2">
            <h3 className="font-semibold">3. No Matches</h3>
            <div className="p-4 bg-muted rounded-lg">
              <HighlightText
                text="Hello World"
                highlightTerms="xyz"
              />
            </div>
          </div>

          {/* Case Sensitive */}
          <div className="space-y-2">
            <h3 className="font-semibold">4. Case Sensitive</h3>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Case Insensitive (default):
                </p>
                <HighlightText
                  text="The dog is chasing the Dog"
                  highlightTerms="dog"
                  caseSensitive={false}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Case Sensitive:
                </p>
                <HighlightText
                  text="The dog is chasing the Dog"
                  highlightTerms="dog"
                  caseSensitive={true}
                />
              </div>
            </div>
          </div>

          {/* Special Characters */}
          <div className="space-y-2">
            <h3 className="font-semibold">5. Special Characters</h3>
            <div className="p-4 bg-muted rounded-lg">
              <HighlightText
                text="Price: $100.00 (50% off)"
                highlightTerms="$100"
                autoEscape={true}
              />
            </div>
          </div>

          {/* Custom Styling */}
          <div className="space-y-2">
            <h3 className="font-semibold">6. Custom Styling</h3>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Default (yellow background):
                </p>
                <HighlightText
                  text="Hello World"
                  highlightTerms="Hello"
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Custom (blue background):
                </p>
                <HighlightText
                  text="Hello World"
                  highlightTerms="Hello"
                  highlightClassName="bg-blue-500 text-white px-1 rounded"
                />
              </div>
            </div>
          </div>

          {/* Edge Cases */}
          <div className="space-y-2">
            <h3 className="font-semibold">7. Edge Cases</h3>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Empty text:
                </p>
                <HighlightText text="" highlightTerms="test" />
                <span className="text-muted-foreground">(empty)</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Empty highlight terms:
                </p>
                <HighlightText text="Hello World" highlightTerms={[]} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Text with newlines:
                </p>
                <HighlightText
                  text="Line 1\nLine 2\nLine 3"
                  highlightTerms="Line"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Test Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exampleTexts.map((exampleText, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => {
                  setText(exampleText)
                  setHighlightTerm(
                    Array.isArray(exampleTerms[index])
                      ? exampleTerms[index].join(', ')
                      : exampleTerms[index][0]
                  )
                }}
                className="h-auto p-4 text-left justify-start"
              >
                <div>
                  <p className="font-semibold mb-1">Example {index + 1}</p>
                  <p className="text-sm text-muted-foreground">
                    {exampleText.substring(0, 50)}...
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Component Features */}
      <Card>
        <CardHeader>
          <CardTitle>Component Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2">
            <li>✅ Migrated from JSX to TSX with full TypeScript support</li>
            <li>✅ Supports single or multiple highlight terms</li>
            <li>✅ Case-sensitive and case-insensitive matching</li>
            <li>✅ Auto-escape for special regex characters</li>
            <li>✅ Custom highlight styling with Tailwind CSS</li>
            <li>✅ Graceful handling of edge cases (empty text, no matches)</li>
            <li>✅ Uses react-highlight-words library</li>
            <li>✅ No dangerouslySetInnerHTML (uses React element composition)</li>
            <li>✅ Performant for longer text blocks</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

