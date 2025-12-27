'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store'
import { SubHeader } from '@/components/SubHeader'
import { PaginatedActivityList } from './PaginatedActivityList'
import ErrorBoundary from '@/components/ErrorBoundary'
import type { ActivityProps, ActivityEventType, DateRangeFilter } from '@/types/activity'

export function Activity({ showSubHeader = true, userId = '' }: ActivityProps) {
  const setFilterValue = useAppStore((state) => state.setFilterValue)
  const conditions: ActivityEventType[] = ['POSTED']
  const [selectedEvent, setSelectedEvent] = useState<ActivityEventType[]>(conditions)
  const [dateRangeFilter] = useState<DateRangeFilter>({
    startDate: '',
    endDate: '',
  })
  const [selectAll, setSelectAll] = useState<string[]>(['ALL'])

  // Functions kept for future use but currently unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleSelectAll = (newSelectAll: string[]) => {
    if (newSelectAll.length) {
      setSelectedEvent(conditions)
      setFilterValue(conditions)
    }
    setSelectAll(newSelectAll)
  }
  void _handleSelectAll

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleActivityEvent = (newActivityEvent: ActivityEventType[]) => {
    if (selectAll.length) {
      const newFilter = conditions.filter(
        (condition) => !newActivityEvent.includes(condition)
      )
      setSelectAll([])
      setSelectedEvent(newFilter)
      setFilterValue(newFilter)
    } else if (!newActivityEvent.length) {
      setSelectAll(['ALL'])
      setSelectedEvent(conditions)
      setFilterValue(conditions)
    } else {
      const isAllToggled = newActivityEvent.length === 4
      setSelectAll(isAllToggled ? ['ALL'] : [])
      setSelectedEvent(newActivityEvent)
      setFilterValue(newActivityEvent)
    }
  }
  void _handleActivityEvent

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <ErrorBoundary>
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        {showSubHeader && (
          <div className="w-full">
            <SubHeader
              showFilterIconButton={false}
              headerName="Activity Feed"
              setOffset={() => {}}
            />
          </div>
        )}

        <div className="w-full mr-2.5 mb-2.5 max-w-[70%] sm:mr-1.5 sm:ml-1.5 sm:max-w-full">
          <PaginatedActivityList
            userId={userId}
            searchKey=""
            startDateRange={dateRangeFilter.startDate}
            endDateRange={dateRangeFilter.endDate}
            activityEvent={selectedEvent}
            defaultPageSize={15}
            pageParam="page"
            pageSizeParam="page_size"
            showPageInfo={true}
            showFirstLast={true}
            maxVisiblePages={5}
          />
        </div>
      </div>
    </ErrorBoundary>
  )
}

