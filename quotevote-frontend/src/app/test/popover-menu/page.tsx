'use client'

import { useState } from 'react'
import { PopoverMenu } from '@/components/PopoverMenu'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AppRoute } from '@/types/components'

/**
 * Test Page for PopoverMenu Component
 * 
 * This page demonstrates the PopoverMenu component functionality:
 * - Trigger button and open/close behavior
 * - Menu item clicks and navigation
 * - Keyboard accessibility (Tab, Enter, Escape)
 * - Selected state highlighting
 * - Mobile-only display
 */
export default function PopoverMenuTestPage() {
  const [open, setOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState('Search')

  const mockAppRoutes: AppRoute[] = [
    {
      path: 'search',
      name: 'Search',
      layout: '/',
    },
    {
      path: 'post',
      name: 'Posts',
      layout: '/',
    },
    {
      path: 'Profile',
      name: 'My Profile',
      layout: '/',
    },
    {
      path: '/logout',
      name: 'Logout',
      layout: '/logout',
    },
    {
      path: 'ControlPanel',
      name: 'Control Panel',
      layout: '/',
      requiresAuth: true,
    },
  ]

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handlePageChange = (pageName: string) => {
    setCurrentPage(pageName)
    setOpen(false)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">PopoverMenu Component Test</h1>
          <p className="text-muted-foreground">
            Test page for the migrated PopoverMenu component
          </p>
        </div>

        <Card className="p-6">
          <CardHeader>
            <CardTitle>Component Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary rounded-lg p-4">
              <PopoverMenu
                appRoutes={mockAppRoutes}
                open={open}
                handleClick={handleClick}
                handleClose={handleClose}
                page={currentPage}
              />
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Current State:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Popover open: {open ? 'Yes' : 'No'}</li>
                <li>Current page: {currentPage}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Basic Functionality</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Click the menu icon (hamburger) to open the popover</li>
                  <li>Click a menu item to navigate and close the popover</li>
                  <li>Click outside the popover to close it</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Keyboard Navigation</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Tab</kbd> to navigate between menu items</li>
                  <li>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to activate a menu item</li>
                  <li>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Escape</kbd> to close the popover</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Visual States</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Verify the current page is highlighted in the menu</li>
                  <li>Check hover states on menu items</li>
                  <li>Verify focus states during keyboard navigation</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. Responsive Behavior</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Component should only be visible on mobile devices (below md breakpoint)</li>
                  <li>On desktop (md and above), the component should be hidden</li>
                  <li>Resize your browser window to test responsive behavior</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">5. Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Verify ARIA labels are present on the trigger button</li>
                  <li>Check that menu items have proper ARIA roles</li>
                  <li>Verify the selected item has aria-current=&quot;page&quot;</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle>Interactive Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Change Current Page</h3>
              <div className="flex flex-wrap gap-2">
                {mockAppRoutes.map((route) => (
                  <Button
                    key={route.path}
                    variant={currentPage === route.name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(route.name)}
                  >
                    {route.name}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Control Popover</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(true)}
                >
                  Open Popover
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Close Popover
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle>Component Props</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <code className="bg-muted px-2 py-1 rounded">appRoutes</code>
                <p className="text-muted-foreground mt-1">
                  Array of route objects with path, name, layout, and optional icon
                </p>
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">open</code>
                <p className="text-muted-foreground mt-1">
                  Boolean controlling whether the popover is open
                </p>
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">handleClick</code>
                <p className="text-muted-foreground mt-1">
                  Callback function called when the trigger button is clicked
                </p>
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">handleClose</code>
                <p className="text-muted-foreground mt-1">
                  Callback function called when the popover should be closed
                </p>
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">page</code>
                <p className="text-muted-foreground mt-1">
                  Current page name used to highlight the active menu item
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

