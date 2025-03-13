import { supabase } from './supabase-client'

/**
 * Parse a sitemap URL asynchronously
 * @param {string} sitemapUrl - The URL of the sitemap to parse
 * @param {string} userId - The ID of the user initiating the request
 * @returns {Promise<Object>} - The response from the edge function
 */
export async function parseSitemap(sitemapUrl, userId) {
  try {
    const { data, error } = await supabase.functions.invoke('parse-sitemap', {
      body: { sitemapUrl, userId },
    })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error parsing sitemap:', error)
    throw error
  }
}

/**
 * Get the status of a sitemap job
 * @param {string} jobId - The ID of the job to check
 * @returns {Promise<Object>} - The job status
 */
export async function getSitemapJobStatus(jobId) {
  try {
    const { data, error } = await supabase
      .from('sitemap_jobs')
      .select('*')
      .eq('id', jobId)
      .single()
      
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting job status:', error)
    throw error
  }
}

/**
 * Get all sitemap URLs for a specific sitemap
 * @param {string} sitemapUrl - The URL of the sitemap
 * @param {number} page - The page number for pagination
 * @param {number} pageSize - The number of items per page
 * @returns {Promise<Object>} - The sitemap URLs with pagination info
 */
export async function getSitemapUrls(sitemapUrl, page = 1, pageSize = 50) {
  try {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    const { data, error, count } = await supabase
      .from('sitemap_urls')
      .select('*', { count: 'exact' })
      .eq('sitemap_url', sitemapUrl)
      .range(from, to)
      
    if (error) throw error
    return {
      data,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount: count,
        totalPages: Math.ceil(count / pageSize)
      }
    }
  } catch (error) {
    console.error('Error getting sitemap URLs:', error)
    throw error
  }
}

/**
 * Get all notifications for a user
 * @param {string} userId - The ID of the user
 * @param {boolean} unreadOnly - Whether to only return unread notifications
 * @returns {Promise<Array>} - The user's notifications
 */
export async function getUserNotifications(userId, unreadOnly = false) {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (unreadOnly) {
      query = query.eq('read', false)
    }
    
    const { data, error } = await query
      
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting notifications:', error)
    throw error
  }
} 