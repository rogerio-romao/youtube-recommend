import { deleteUserSession } from '../../utils/auth'

export default defineEventHandler((event) => {
  deleteUserSession(event)
  return sendRedirect(event, '/')
})
