import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './ui_components/AppLayout'
import AppLayout2 from './ui_components/AppLayout2'
import HomePage from './pages/HomePage'
import DetailPage from './pages/DetailPage'
import ReadingGroupPage from './pages/ReadingGroupPage'
import SignupPage from './pages/SignupPage'
import CreatePostPage from './pages/CreatePostPage'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './ui_components/ProtectedRoute'
import ProfilePage from './pages/ProfilePage'
import BookPagesPage from './pages/BookPagesPage'
import AllReadingGroupsPage from './pages/AllReadingGroupsPage'
import AllBooksPage from './pages/AllBooksPage'
import CreateReadingGroupPage from './pages/CreateReadingGroupPage'
import NotificationsPage from './pages/NotificationsPage'
import QuestsPage from './pages/QuestsPage'
import GroupQuestsPage from './pages/GroupQuestsPage'
import CreateQuestPage from './pages/CreateQuestPage'
import PrizeBoardPage from './pages/PrizeBoardPage'
import RewardsPage from './pages/RewardsPage'
import { useEffect, useState } from 'react'
import { getUsername } from './services/apiBook'
import { useQuery } from '@tanstack/react-query'
import NotFoundPage from './pages/NotFoundPage'

const App = () => {
  const [username, setUsername] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const { data } = useQuery({
    queryKey: ['username'],
    queryFn: getUsername,
  })

  useEffect(
    function () {
      if (data) {
        setUsername(data.username)
        setIsAuthenticated(true)
      }
    },
    [data]
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout
              isAuthenticated={isAuthenticated}
              username={username}
              setUsername={setUsername}
              setIsAuthenticated={setIsAuthenticated}
            />
          }
        >
          <Route index element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
          <Route
            path="profile/:username"
            element={<ProfilePage authUsername={username} />}
          />
          <Route
            path="books/:slug"
            element={
              <DetailPage
                username={username}
                isAuthenticated={isAuthenticated}
              />
            }
          />
          <Route
            path="groups/:slug"
            element={
              <ReadingGroupPage
                username={username}
                isAuthenticated={isAuthenticated}
              />
            }
          />
          <Route
            path="groups"
            element={
              <AllReadingGroupsPage
                username={username}
                isAuthenticated={isAuthenticated}
              />
            }
          />
          <Route
            path="books"
            element={
              <AllBooksPage
                username={username}
                isAuthenticated={isAuthenticated}
              />
            }
          />
          <Route
            path="notifications"
            element={
              <NotificationsPage
                username={username}
                isAuthenticated={isAuthenticated}
              />
            }
          />
          <Route
            path="quests"
            element={
              <ProtectedRoute>
                <QuestsPage
                  username={username}
                  isAuthenticated={isAuthenticated}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="quests/create"
            element={
              <ProtectedRoute>
                <CreateQuestPage
                  username={username}
                  isAuthenticated={isAuthenticated}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="groups/:slug/quests"
            element={
              <GroupQuestsPage
                username={username}
                isAuthenticated={isAuthenticated}
              />
            }
          />
          <Route
            path="rewards"
            element={
              <ProtectedRoute>
                <RewardsPage
                  username={username}
                  isAuthenticated={isAuthenticated}
                />
              </ProtectedRoute>
            }
          />
          <Route path="signup" element={<SignupPage />} />
          <Route
            path="create_book"
            element={
              <ProtectedRoute>
                <CreatePostPage isAuthenticated={isAuthenticated} />
              </ProtectedRoute>
            }
          />
          <Route
            path="create_group"
            element={
              <ProtectedRoute>
                <CreateReadingGroupPage isAuthenticated={isAuthenticated} />
              </ProtectedRoute>
            }
          />
          <Route
            path="signin"
            element={
              <LoginPage
                setIsAuthenticated={setIsAuthenticated}
                setUsername={setUsername}
              />
            }
          />
        </Route>
        <Route
          path="/books/:slug/page"
          // element={
          //   <AppLayout2
          //     isAuthenticated={isAuthenticated}
          //     username={username}
          //     setUsername={setUsername}
          //     setIsAuthenticated={setIsAuthenticated}
          //   />
          // }
        >
          <Route index element={<BookPagesPage />} />
        </Route>
        <Route
          path="/groups/:slug/board"
          element={
            <PrizeBoardPage
              username={username}
              isAuthenticated={isAuthenticated}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
