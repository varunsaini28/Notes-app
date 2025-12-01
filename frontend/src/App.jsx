import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Trash2, Loader2, Calendar, AlertCircle } from "lucide-react";


function App() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Get API URL from environment variables
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  async function getNotes() {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_URL}/notes`);
      setNotes(response.data.data);
    } catch (err) {
      setError("Failed to fetch notes. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function addNote() {
    if (!title.trim() || !content.trim()) {
      setError("Both title and content are required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      setAdding(true);
      setError("");
      await axios.post(`${API_URL}/add`, {
        title: title.trim(),
        content: content.trim()
      });
      
      setTitle("");
      setContent("");
      setSuccess("Note added successfully!");
      setTimeout(() => setSuccess(""), 3000);
      getNotes();
    } catch (err) {
      setError("Failed to add note. Please try again.");
      setTimeout(() => setError(""), 3000);
      console.error(err);
    } finally {
      setAdding(false);
    }
  }

  async function deleteNote(id) {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      await axios.delete(`${API_URL}/notes/${id}`);
      setSuccess("Note deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
      getNotes();
    } catch (err) {
      setError("Failed to delete note");
      setTimeout(() => setError(""), 3000);
      console.error(err);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNote();
    }
  };

  useEffect(() => {
    getNotes();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Notes<span className="text-blue-600">.</span>
          </h1>
          <p className="text-gray-600 mt-2">Capture your thoughts and ideas</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* Left Column - Form */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Add New Note
              </h2>

              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {success}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyPress={handleKeyPress}
                    type="text"
                    placeholder="Enter note title..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your note here..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200 resize-none h-40"
                    rows="6"
                  />
                </div>

                <button
                  onClick={addNote}
                  disabled={adding}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {adding ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding Note...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add Note
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Tip:</span> Press Enter to add note
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Notes */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  My Notes
                  <span className="ml-2 bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                    {notes.length}
                  </span>
                </h2>
                <button
                  onClick={getNotes}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1 transition duration-200"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-gray-600">Loading your notes...</p>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 text-gray-400">
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No notes yet</h3>
                  <p className="text-gray-500">Add your first note to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="group bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition duration-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-800 text-lg line-clamp-1">
                          {note.title}
                        </h3>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition duration-200"
                          title="Delete note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-4 whitespace-pre-wrap">
                        {note.content}
                      </p>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1.5" />
                          {note.created_at ? (
                            new Date(note.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          ) : (
                            'Recently'
                          )}
                        </div>
                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-full">
                          Note
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stats Footer */}
              {notes.length > 0 && !loading && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>Total notes: {notes.length}</span>
                      <span>•</span>
                      <span>Characters: {notes.reduce((acc, note) => acc + note.content.length, 0)}</span>
                    </div>
                    <div>
                      Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Notes App. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;