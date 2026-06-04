import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import StudyMode from './pages/StudyMode';
import QuizMode from './pages/QuizMode';
import TestMode from './pages/TestMode';

export default function App() {
  return (
    <BrowserRouter basename="/gpodt">
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/study" element={<StudyMode />} />
          <Route path="/study/:categoryId" element={<StudyMode />} />
          <Route path="/quiz" element={<QuizMode />} />
          <Route path="/quiz/:categoryId" element={<QuizMode />} />
          <Route path="/test" element={<TestMode />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
