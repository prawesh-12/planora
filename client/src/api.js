import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default api

export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const getMe = () => api.get('/auth/me')

export const getOrgs = () => api.get('/orgs')
export const getOrg = (id) => api.get(`/orgs/${id}`)
export const createOrg = (data) => api.post('/orgs', data)
export const inviteMember = (orgId, data) => api.post(`/orgs/${orgId}/invite`, data)
export const removeMember = (orgId, userId) =>
  api.delete(`/orgs/${orgId}/members/${userId}`)

export const getBoards = (orgId) => api.get('/boards', { params: { orgId } })
export const getBoard = (id) => api.get(`/boards/${id}`)
export const createBoard = (data) => api.post('/boards', data)
export const deleteBoard = (id) => api.delete(`/boards/${id}`)

export const createColumn = (data) => api.post('/columns', data)
export const reorderColumns = (data) => api.patch('/columns/reorder', data)
export const deleteColumn = (id) => api.delete(`/columns/${id}`)

export const createCard = (data) => api.post('/cards', data)
export const moveCard = (id, data) => api.patch(`/cards/${id}/move`, data)
export const archiveCard = (id) => api.patch(`/cards/${id}/archive`)
export const deleteCard = (id) => api.delete(`/cards/${id}`)
