'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@apollo/client/react'
import { X, Loader2, Link2, Info, AlertTriangle } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppStore } from '@/store'
import { useResponsive } from '@/hooks/useResponsive'
import { submitPostSchema, type SubmitPostFormValues } from '@/lib/validation/submitPostSchema'
import { sanitizeUrl } from '@/lib/utils/sanitizeUrl'
import { CREATE_GROUP, SUBMIT_POST } from '@/graphql/mutations'
import { SubmitPostAlert } from './SubmitPostAlert'
import type { SubmitPostFormProps } from '@/types/components'
import { cn } from '@/lib/utils'

export function SubmitPostForm({ options = [], user, setOpen }: SubmitPostFormProps) {
  const { isMobile } = useResponsive()
  const setSelectedPost = useAppStore((state) => state.setSelectedPost)
  const [submitPost, { loading }] = useMutation(SUBMIT_POST)
  const [createGroup, { loading: loadingGroup }] = useMutation(CREATE_GROUP)
  const [error, setError] = useState<Error | { message?: string } | null>(null)
  const [shareableLink, setShareableLink] = useState('')
  const [showAlert, setShowAlert] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [isPasting, setIsPasting] = useState(false)
  const errorAlertRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SubmitPostFormValues>({
    resolver: zodResolver(submitPostSchema),
    defaultValues: {
      title: '',
      text: '',
      citationUrl: '',
    },
  })

  // Auto-scroll to error alert when URL-in-body error appears
  useEffect(() => {
    if (errors.text?.message?.includes('Links are not allowed') && errorAlertRef.current) {
      errorAlertRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [errors.text])

  const parseURLContent = async (url: string) => {
    try {
      // Note: The original code used cors-anywhere which may not be available
      // This is a simplified version - you may need to implement a backend proxy
      // Using no-cors mode limits what we can do, so we'll just set a basic title
      await fetch(url, {
        mode: 'no-cors', // Limited functionality
      })

      // Since we can't easily parse the response with no-cors,
      // we'll just set a basic title
      const title = 'Extracted Content'
      setError(null)
      reset({
        title,
        text: url,
        group: undefined,
      })
    } catch (err) {
      console.error('Error parsing URL:', err)
      setError(new Error('Could not extract site content. Please try again.'))
      setShowAlert(true)
    }
  }

  const onSubmit = async (values: SubmitPostFormValues) => {
    const { title, text, group, citationUrl } = values

    // Sanitize citation URL before submission
    const sanitizedCitationUrl = citationUrl ? sanitizeUrl(citationUrl) : null

    // Handle case where group might be a string (typed value)
    const groupData =
      typeof group === 'string' ? { title: group } : group

    try {
      let newGroup
      const isNewGroup = groupData && !('_id' in groupData)

      if (isNewGroup) {
        setIsCreatingGroup(true)
        setNewGroupName(
          typeof groupData === 'object' && 'title' in groupData
            ? groupData.title
            : ''
        )

        const createGroupResult = await createGroup({
          variables: {
            group: {
              creatorId: user._id,
              title:
                typeof groupData === 'object' && 'title' in groupData
                  ? groupData.title
                  : '',
              description: `Description for: ${
                typeof groupData === 'object' && 'title' in groupData
                  ? groupData.title
                  : ''
              } group`,
              privacy: 'public',
            },
          },
        })

        newGroup = (createGroupResult.data as { createGroup?: { _id: string } })?.createGroup
        setIsCreatingGroup(false)
        setNewGroupName('')
      }

      const postGroupId = isNewGroup
        ? newGroup?._id
        : typeof groupData === 'object' && '_id' in groupData
          ? groupData._id
          : ''

      const submitResult = await submitPost({
        variables: {
          post: {
            userId: user._id,
            text,
            title,
            groupId: postGroupId,
            citationUrl: sanitizedCitationUrl,
          },
        },
      })

      const { _id, url } = (submitResult.data as { addPost?: { _id: string; url: string } })?.addPost || {}
      if (_id) {
        setSelectedPost(_id)
        setShareableLink(url || '')
        setShowAlert(true)
      }
    } catch (err) {
      setIsCreatingGroup(false)
      setNewGroupName('')
      setError(
        err instanceof Error
          ? err
          : { message: 'An error occurred while creating your post' }
      )
      setShowAlert(true)
    }
  }

  const hideAlert = () => {
    setShowAlert(false)
    setShareableLink('')
    reset()
  }

  const handlePaste = () => {
    setIsPasting(true)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const contentValue = e.target.value
    const validURL =
      /^(?:http(s)?:\/\/)([\w.-])+(?:[\w.-]+)+([\w\-._~:/?#[\]@!$&'()*+,;=.])+$/
    if (isPasting && contentValue.match(validURL)) {
      parseURLContent(contentValue)
    }
    setIsPasting(false)
  }

  return (
    <>
      {showAlert && (
        <SubmitPostAlert
          hideAlert={hideAlert}
          shareableLink={shareableLink}
          error={error}
          setShowAlert={setShowAlert}
          setOpen={setOpen}
        />
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card
          className={cn(
            'flex flex-col w-full',
            isMobile ? 'h-screen max-h-screen' : 'max-h-[calc(100vh-200px)]'
          )}
        >
          <CardHeader
            className={cn(
              'flex flex-row items-center justify-between',
              isMobile ? 'p-4' : 'p-5'
            )}
          >
            <CardTitle className="text-2xl text-[#52b274]">Create Quote</CardTitle>
            <CardAction>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="text-[#52b274]"
              >
                <X className="h-5 w-5" />
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent
            className={cn(
              'flex-1 flex flex-col overflow-hidden',
              isMobile ? 'px-4' : 'px-5'
            )}
          >
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter Title"
                  {...register('title')}
                  className={cn(errors.title && 'border-destructive')}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* Citation URL Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="citationUrl">Citation URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>Optional: Add a citation link to credit the original source. No other URLs are allowed in the post body.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="citationUrl"
                  placeholder="https://example.com/article"
                  {...register('citationUrl')}
                  className={cn(errors.citationUrl && 'border-destructive')}
                />
                {errors.citationUrl && (
                  <p className="text-sm text-destructive">{errors.citationUrl.message}</p>
                )}
              </div>

              <div className="border-t" />

              <div className="flex-1 flex flex-col min-h-0 space-y-2">
                <Label htmlFor="text">Content</Label>
                <div className="flex-1 min-h-0">
                  <Textarea
                    id="text"
                    placeholder="Enter text or URL here"
                    {...register('text')}
                    onPaste={handlePaste}
                    onChange={(e) => {
                      register('text').onChange(e)
                      handleTextChange(e)
                    }}
                    className={cn(
                      'h-full min-h-[50vh] resize-none',
                      isMobile ? 'min-h-[40vh]' : 'min-h-[60vh]',
                      errors.text && 'border-destructive'
                    )}
                  />
                </div>
                {errors.text && (
                  errors.text.message?.includes('Links are not allowed') ? (
                    <Alert ref={errorAlertRef} variant="destructive" className="mt-2">
                      <AlertTriangle className="h-5 w-5" />
                      <AlertTitle className="text-base font-semibold">⚠️ No Links Allowed in Body</AlertTitle>
                      <AlertDescription className="text-sm">
                        {errors.text.message}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <p className="text-sm text-destructive">{errors.text.message}</p>
                  )
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter
            className={cn(
              'flex flex-col gap-4 border-t pt-5',
              isMobile ? 'px-4 pb-4' : 'px-5 pb-5'
            )}
          >
            <div
              className={cn(
                'flex flex-col gap-4 w-full',
                isMobile ? '' : 'flex-row items-center justify-between'
              )}
            >
              <div className="flex items-center gap-2">
                <Label className="font-medium">Who can see your post</Label>
                {isCreatingGroup && (
                  <span className="text-sm text-[#52b274] italic">
                    Creating group &quot;{newGroupName}&quot;...
                  </span>
                )}
              </div>

              <div className={cn('w-full', isMobile ? '' : 'max-w-[220px]')}>
                <Controller
                  name="group"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={options as Array<{ _id?: string; title: string; [key: string]: unknown }>}
                      value={field.value || null}
                      onValueChange={field.onChange}
                      placeholder="Select or create a group"
                      label=""
                      error={!!errors.group}
                      errorMessage={errors.group?.message}
                      disabled={loadingGroup || loading}
                      allowCreate={true}
                      className="bg-[rgba(160,243,204,0.6)]"
                    />
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end w-full">
              <Button
                id="submit-button"
                type="submit"
                variant="default"
                className="w-full bg-[#52b274] hover:bg-[#52b274]/90 text-white text-lg"
                disabled={loadingGroup || loading}
              >
                {loading || loadingGroup ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'POST'
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </>
  )
}

