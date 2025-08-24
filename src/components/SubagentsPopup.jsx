import React, { useState, useEffect, useRef } from 'react';
import { authenticatedFetch } from '../utils/api';

const colorMap = {
  red: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  green: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
  magenta: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
};

const SubagentsPopup = ({ isOpen, onClose, onSelectAgent, buttonRef }) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const popupRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchAgents();
      // Focus search input when popup opens
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, buttonRef]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/agents');
      
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      } else {
        console.error('Failed to fetch agents');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(agents.map(agent => agent.category))].sort();
  
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAgentSelect = (agent) => {
    onSelectAgent(agent);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        ref={popupRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Subagent
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Search */}
          <input
            ref={searchRef}
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({agents.length})
            </button>
            {categories.map(category => {
              const count = agents.filter(a => a.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.replace('-', ' ')} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchTerm || selectedCategory !== 'all' ? 'No agents found matching your criteria' : 'No agents available'}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredAgents.map(agent => (
                <div
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent)}
                  className="group p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                          {agent.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          colorMap[agent.color] || colorMap.gray
                        }`}>
                          {agent.category.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {agent.description.split('\\n')[0] || 'No description available'}
                      </p>
                      {agent.tools && agent.tools.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {agent.tools.slice(0, 4).map((tool, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded text-xs font-mono">
                              {tool}
                            </span>
                          ))}
                          {agent.tools.length > 4 && (
                            <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded text-xs">
                              +{agent.tools.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <svg 
                      className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubagentsPopup;