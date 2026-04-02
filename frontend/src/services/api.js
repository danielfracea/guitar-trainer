import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

export const getExercises = () => api.get('/exercises')
export const getExercise = (id) => api.get(`/exercises/${id}`)
export const updateExercise = (id, data) => api.put(`/exercises/${id}`, data)
export const resetExercises = () => api.post('/exercises/reset')
