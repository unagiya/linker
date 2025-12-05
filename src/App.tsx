/**
 * Appコンポーネント
 * ルートコンポーネント
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProfileProvider } from "./contexts/ProfileContext";
import { LocalStorageRepository } from "./repositories";
import { Navigation } from "./components/Navigation";
import { Home } from "./pages/Home";
import { CreateProfile } from "./pages/CreateProfile";
import { ViewProfile } from "./pages/ViewProfile";
import { EditProfile } from "./pages/EditProfile";
import { NotFound } from "./pages/NotFound";
import "./App.css";

// Repositoryのインスタンスを作成
const repository = new LocalStorageRepository();

function App() {
  return (
    <BrowserRouter>
      <ProfileProvider repository={repository}>
        <div className="app">
          <Navigation />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateProfile />} />
              <Route path="/profile/:id" element={<ViewProfile />} />
              <Route path="/profile/:id/edit" element={<EditProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </ProfileProvider>
    </BrowserRouter>
  );
}

export default App;
