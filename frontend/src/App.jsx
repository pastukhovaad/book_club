import { lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './ui_components/AppLayout'
import ProtectedRoute from './ui_components/ProtectedRoute'

const HomePage = lazy(() => import('./pages/HomePage'))
const DetailPage = lazy(() => import('./pages/DetailPage'))
const ReadingGroupPage = lazy(() => import('./pages/ReadingGroupPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const CreateBookPage = lazy(() => import('./pages/CreateBookPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const BookPagesPage = lazy(() => import('./pages/BookPagesPage'))
const AllReadingGroupsPage = lazy(() => import('./pages/AllReadingGroupsPage'))
const AllBooksPage = lazy(() => import('./pages/AllBooksPage'))
const CreateReadingGroupPage = lazy(() => import('./pages/CreateReadingGroupPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const QuestsPage = lazy(() => import('./pages/QuestsPage'))
const GroupQuestsPage = lazy(() => import('./pages/GroupQuestsPage'))
const CreateQuestPage = lazy(() => import('./pages/CreateQuestPage'))
const PrizeBoardPage = lazy(() => import('./pages/PrizeBoardPage'))
const UserPrizeBoardPage = lazy(() => import('./pages/UserPrizeBoardPage'))
const RewardsPage = lazy(() => import('./pages/RewardsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const App = () => {

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<AppLayout />}
        >
          <Route index element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
          <Route
            path="profile/:username"
            element={<ProfilePage />}
          />
          <Route
            path="profile/:username/board"
            element={
              <ProtectedRoute>
                <UserPrizeBoardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="books/:slug"
            element={<DetailPage />}
          />
          <Route
            path="groups/:slug"
            element={
              <ProtectedRoute>
                <ReadingGroupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="groups"
            element={<AllReadingGroupsPage />}
          />
          <Route
            path="books"
            element={<AllBooksPage />}
          />
          <Route
            path="notifications"
            element={<NotificationsPage />}
          />
          <Route
            path="quests"
            element={
              <ProtectedRoute>
                <QuestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="quests/create"
            element={
              <ProtectedRoute>
                <CreateQuestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="groups/:slug/quests"
            element={
              <ProtectedRoute>
                <GroupQuestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="rewards"
            element={
              <ProtectedRoute>
                <RewardsPage />
              </ProtectedRoute>
            }
          />
          <Route path="signup" element={<SignupPage />} />
          <Route
            path="create_book"
            element={
              <ProtectedRoute>
                <CreateBookPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="create_group"
            element={
              <ProtectedRoute>
                <CreateReadingGroupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="groups/:slug/board"
            element={
              <ProtectedRoute>
                <PrizeBoardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="signin"
            element={<LoginPage />}
          />
        </Route>
        <Route path="/books/:slug/page" element={<BookPagesPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
