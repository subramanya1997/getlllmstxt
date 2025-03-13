import { useState, useEffect } from 'react'
import { parseSitemap, getSitemapJobStatus, getSitemapUrls } from '../api-client'
import { useUser } from '@supabase/auth-helpers-react'

const POLL_INTERVAL = 3000 // Poll every 3 seconds

export default function SitemapProcessor() {
  const user = useUser()
  const [sitemapUrl, setSitemapUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [job, setJob] = useState(null)
  const [error, setError] = useState(null)
  const [urls, setUrls] = useState([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  // Poll for job status updates when a job is active
  useEffect(() => {
    let intervalId = null
    
    if (job && ['queued', 'processing'].includes(job.status)) {
      intervalId = setInterval(async () => {
        try {
          const updatedJob = await getSitemapJobStatus(job.id)
          setJob(updatedJob)
          
          // If job is completed, stop polling and fetch results
          if (['completed', 'failed'].includes(updatedJob.status)) {
            clearInterval(intervalId)
            
            if (updatedJob.status === 'completed') {
              loadSitemapUrls(sitemapUrl)
            }
          }
        } catch (err) {
          console.error('Error polling job status:', err)
          clearInterval(intervalId)
        }
      }, POLL_INTERVAL)
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [job, sitemapUrl])
  
  // Load URLs for the processed sitemap
  const loadSitemapUrls = async (url, pageNum = 1) => {
    try {
      const result = await getSitemapUrls(url, pageNum)
      setUrls(result.data)
      setPagination(result.pagination)
      setPage(pageNum)
    } catch (err) {
      setError(`Error loading sitemap URLs: ${err.message}`)
    }
  }
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    if (!sitemapUrl) {
      setError('Please enter a sitemap URL')
      return
    }
    
    setIsProcessing(true)
    
    try {
      const response = await parseSitemap(sitemapUrl, user.id)
      setJob({
        id: response.job_id,
        status: response.status,
        total_urls: response.total_urls,
        processed_urls: 0
      })
    } catch (err) {
      setError(`Error processing sitemap: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!job || job.total_urls === 0) return 0
    return Math.floor((job.processed_urls / job.total_urls) * 100)
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Sitemap Processor</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="url"
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
            placeholder="Enter sitemap URL (e.g., https://example.com/sitemap.xml)"
            className="flex-1 p-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={isProcessing || !user}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            {isProcessing ? 'Processing...' : 'Process Sitemap'}
          </button>
        </div>
        {!user && (
          <p className="text-red-500 mt-2">You must be logged in to process sitemaps</p>
        )}
      </form>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {job && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Job Status</h2>
          <div className="bg-gray-100 p-4 rounded">
            <div className="flex justify-between mb-2">
              <span>Status: <span className={`font-semibold ${job.status === 'completed' ? 'text-green-600' : job.status === 'failed' ? 'text-red-600' : 'text-blue-600'}`}>{job.status}</span></span>
              <span>URLs: {job.processed_urls || 0} / {job.total_urls || 0}</span>
            </div>
            
            {['queued', 'processing'].includes(job.status) && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {urls.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Processed URLs ({pagination?.totalCount || 0})</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border text-left">URL</th>
                  <th className="py-2 px-4 border text-left">Title</th>
                  <th className="py-2 px-4 border text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((url) => (
                  <tr key={url.id}>
                    <td className="py-2 px-4 border">
                      <a href={url.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {url.url.length > 60 ? `${url.url.substring(0, 60)}...` : url.url}
                      </a>
                    </td>
                    <td className="py-2 px-4 border">{url.title || '-'}</td>
                    <td className="py-2 px-4 border">
                      {url.description 
                        ? (url.description.length > 100 ? `${url.description.substring(0, 100)}...` : url.description)
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              <button
                onClick={() => loadSitemapUrls(sitemapUrl, Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => loadSitemapUrls(sitemapUrl, Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 