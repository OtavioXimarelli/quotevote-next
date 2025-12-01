/**
 * usePagination Hook Tests
 * 
 * Tests that verify:
 * - Hook initializes correctly from URL params
 * - Hook updates URL when pagination changes
 * - Hook calculates pagination data correctly
 * - Hook handles edge cases
 */

import { renderHook, act } from '@testing-library/react'
import { usePagination } from '@/hooks/usePagination'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

// Mock Next.js navigation hooks
const mockPush = jest.fn()
let mockSearchParamsInstance: URLSearchParams

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/test'),
  useSearchParams: jest.fn(() => mockSearchParamsInstance),
}))

describe('usePagination Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Create a fresh URLSearchParams instance for each test
    mockSearchParamsInstance = new URLSearchParams()
  })

  describe('Initialization', () => {
    it('initializes with default values when no URL params', () => {
      const { result } = renderHook(() => usePagination())

      expect(result.current.currentPage).toBe(1)
      expect(result.current.pageSize).toBe(20)
    })

    it('initializes from URL params', () => {
      mockSearchParamsInstance.set('page', '3')
      mockSearchParamsInstance.set('page_size', '15')

      const { result } = renderHook(() => usePagination())

      expect(result.current.currentPage).toBe(3)
      expect(result.current.pageSize).toBe(15)
    })

    it('uses defaultPage when provided and no URL params', () => {
      // Ensure no URL params are set
      const { result } = renderHook(() =>
        usePagination({ defaultPage: 5 })
      )

      // When URL params are empty, should use defaultPage
      // But the hook reads from URL first, so if URL is empty, it uses defaultPage
      expect(result.current.currentPage).toBe(5)
    })

    it('uses defaultPageSize when provided', () => {
      const { result } = renderHook(() =>
        usePagination({ defaultPageSize: 25 })
      )

      expect(result.current.pageSize).toBe(25)
    })

    it('ignores invalid URL page param', () => {
      mockSearchParamsInstance.set('page', 'invalid')

      const { result } = renderHook(() => usePagination({ defaultPage: 2 }))

      expect(result.current.currentPage).toBe(2)
    })

    it('ignores invalid URL pageSize param', () => {
      mockSearchParamsInstance.set('page_size', 'invalid')

      const { result } = renderHook(() =>
        usePagination({ defaultPageSize: 25 })
      )

      expect(result.current.pageSize).toBe(25)
    })
  })

  describe('Page Changes', () => {
    it('updates URL when page changes', () => {
      const { result } = renderHook(() => usePagination())

      act(() => {
        result.current.handlePageChange(3)
      })

      expect(mockPush).toHaveBeenCalledWith('/test?page=3', { scroll: false })
    })

    it('calls onPageChange callback when provided', () => {
      const onPageChange = jest.fn()
      const { result } = renderHook(() =>
        usePagination({ onPageChange })
      )

      act(() => {
        result.current.handlePageChange(2)
      })

      expect(onPageChange).toHaveBeenCalledWith(2)
    })

    it('does not update URL when page does not change', () => {
      const { result } = renderHook(() => usePagination())

      act(() => {
        result.current.handlePageChange(1)
      })

      // When page doesn't change, handlePageChange checks if page !== currentPage
      // Since currentPage is 1 and we're trying to change to 1, it should not call updateURL
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('updates currentPage state', () => {
      const { result } = renderHook(() => usePagination())

      act(() => {
        result.current.handlePageChange(5)
      })

      // State should update after handlePageChange
      // Note: The state update happens synchronously in the callback
      expect(result.current.currentPage).toBe(5)
      expect(mockPush).toHaveBeenCalledWith('/test?page=5', { scroll: false })
    })
  })

  describe('Page Size Changes', () => {
    it('updates URL when page size changes', () => {
      const { result } = renderHook(() =>
        usePagination({ defaultPageSize: 20 })
      )

      act(() => {
        result.current.handlePageSizeChange(30)
      })

      expect(mockPush).toHaveBeenCalledWith('/test?page=1&page_size=30', {
        scroll: false,
      })
    })

    it('resets to page 1 when page size changes', () => {
      const { result } = renderHook(() =>
        usePagination({ defaultPage: 5 })
      )

      act(() => {
        result.current.handlePageSizeChange(30)
      })

      expect(result.current.currentPage).toBe(1)
    })

    it('calls onPageSizeChange callback when provided', () => {
      const onPageSizeChange = jest.fn()
      const { result } = renderHook(() =>
        usePagination({ onPageSizeChange })
      )

      act(() => {
        result.current.handlePageSizeChange(25)
      })

      expect(onPageSizeChange).toHaveBeenCalledWith(25)
    })

    it('does not include page_size in URL when it matches default', () => {
      const { result } = renderHook(() =>
        usePagination({ defaultPageSize: 20 })
      )

      act(() => {
        // Change to a different page size first
        result.current.handlePageSizeChange(25)
      })

      // Clear previous calls
      mockPush.mockClear()

      act(() => {
        // Now change back to default - should remove page_size param
        result.current.handlePageSizeChange(20)
      })

      // The call should be without page_size since it matches default
      expect(mockPush).toHaveBeenCalledWith('/test?page=1', { scroll: false })
    })
  })

  describe('Pagination Calculation', () => {
    it('calculates pagination correctly for first page', () => {
      const { result } = renderHook(() => usePagination())

      const pagination = result.current.calculatePagination(100)

      expect(pagination.currentPage).toBe(1)
      expect(pagination.totalPages).toBe(5)
      expect(pagination.totalCount).toBe(100)
      expect(pagination.pageSize).toBe(20)
      expect(pagination.hasNextPage).toBe(true)
      expect(pagination.hasPreviousPage).toBe(false)
      expect(pagination.startIndex).toBe(0)
      expect(pagination.endIndex).toBe(20)
    })

    it('calculates pagination correctly for middle page', () => {
      // Set URL param to page 3
      mockSearchParamsInstance.set('page', '3')
      const { result } = renderHook(() => usePagination())

      const pagination = result.current.calculatePagination(100)

      expect(pagination.currentPage).toBe(3)
      expect(pagination.totalPages).toBe(5)
      expect(pagination.startIndex).toBe(40)
      expect(pagination.endIndex).toBe(60)
      expect(pagination.hasNextPage).toBe(true)
      expect(pagination.hasPreviousPage).toBe(true)
    })

    it('calculates pagination correctly for last page', () => {
      // Set URL param to page 5
      mockSearchParamsInstance.set('page', '5')
      const { result } = renderHook(() => usePagination())

      const pagination = result.current.calculatePagination(100)

      expect(pagination.currentPage).toBe(5)
      expect(pagination.totalPages).toBe(5)
      expect(pagination.startIndex).toBe(80)
      expect(pagination.endIndex).toBe(100)
      expect(pagination.hasNextPage).toBe(false)
      expect(pagination.hasPreviousPage).toBe(true)
    })

    it('normalizes page number when out of bounds', () => {
      // Set URL param to page 10 (out of bounds for 50 items with pageSize 20)
      mockSearchParamsInstance.set('page', '10')
      const { result } = renderHook(() => usePagination())

      const pagination = result.current.calculatePagination(50)

      // With 50 items and pageSize 20, totalPages = 3
      // Page 10 is out of bounds, so it should normalize to 3
      expect(pagination.currentPage).toBe(3) // Normalized to max page
      expect(pagination.totalPages).toBe(3)
    })

    it('handles zero totalCount', () => {
      const { result } = renderHook(() => usePagination())

      const pagination = result.current.calculatePagination(0)

      expect(pagination.totalPages).toBe(1)
      expect(pagination.currentPage).toBe(1)
      expect(pagination.startIndex).toBe(0)
      expect(pagination.endIndex).toBe(0)
    })
  })

  describe('Reset to First Page', () => {
    it('resets to first page when called', () => {
      // Set URL param to page 5 first
      mockSearchParamsInstance.set('page', '5')
      const { result } = renderHook(() => usePagination())

      // Verify we start at page 5
      expect(result.current.currentPage).toBe(5)

      act(() => {
        result.current.resetToFirstPage()
      })

      expect(result.current.currentPage).toBe(1)
      expect(mockPush).toHaveBeenCalledWith('/test?page=1', { scroll: false })
    })

    it('does not reset when already on first page', () => {
      const onPageChange = jest.fn()
      const { result } = renderHook(() =>
        usePagination({ onPageChange, defaultPage: 1 })
      )

      act(() => {
        result.current.resetToFirstPage()
      })

      expect(onPageChange).not.toHaveBeenCalled()
    })
  })

  describe('Custom URL Params', () => {
    it('uses custom pageParam', () => {
      const { result } = renderHook(() =>
        usePagination({ pageParam: 'p' })
      )

      act(() => {
        result.current.handlePageChange(2)
      })

      expect(mockPush).toHaveBeenCalledWith('/test?p=2', { scroll: false })
    })

    it('uses custom pageSizeParam', () => {
      const { result } = renderHook(() =>
        usePagination({ pageSizeParam: 'limit' })
      )

      act(() => {
        result.current.handlePageSizeChange(30)
      })

      expect(mockPush).toHaveBeenCalledWith('/test?page=1&limit=30', {
        scroll: false,
      })
    })
  })

  describe('Legacy Support', () => {
    it('provides setCurrentPage as alias for handlePageChange', () => {
      const { result } = renderHook(() => usePagination())

      act(() => {
        result.current.setCurrentPage(3)
      })

      expect(mockPush).toHaveBeenCalledWith('/test?page=3', { scroll: false })
    })

    it('provides setPageSize as alias for handlePageSizeChange', () => {
      const { result } = renderHook(() => usePagination())

      act(() => {
        result.current.setPageSize(25)
      })

      expect(mockPush).toHaveBeenCalledWith('/test?page=1&page_size=25', {
        scroll: false,
      })
    })
  })
})

