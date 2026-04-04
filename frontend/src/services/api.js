import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

export const getExercises = () => api.get('/exercises')
export const getExercise = (id) => api.get(`/exercises/${id}`)
export const updateExercise = (id, data) => api.put(`/exercises/${id}`, data)
export const resetExercises = () => api.post('/exercises/reset')

export const getTemplates = () => api.get('/templates')

export const getSessions = () => api.get('/sessions')
export const createSession = (data) => api.post('/sessions', data)
export const updateSession = (id, data) => api.put(`/sessions/${id}`, data)
export const deleteSession = (id) => api.delete(`/sessions/${id}`)

export const getTablatures = () => api.get('/tablatures')
export const getTablature = (id) => api.get(`/tablatures/${id}`)
export const createTablature = (data) => api.post('/tablatures', data)
export const updateTablature = (id, data) => api.put(`/tablatures/${id}`, data)
export const deleteTablature = (id) => api.delete(`/tablatures/${id}`)
