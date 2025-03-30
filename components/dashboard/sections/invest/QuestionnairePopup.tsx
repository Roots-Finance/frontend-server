// InvestmentQuestionnairePopup.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Upload, GripVertical } from 'lucide-react';

// Import questions data with added initial and final questions
const baseQuestionsData = [
  {
    "name": "is_experienced_investor",
    "type": "boolean",
    "question": "Are you an experienced investor?",
    "description": "This helps us tailor the questionnaire and recommendations to your investment experience level."
  },
  {
    "name": "preferred_sectors",
    "type": "array",
    "question": "Which sectors are you interested in investing in?",
    "description": "Select from sectors like technology, healthcare, finance, energy, consumer goods, industrials, etc."
  },
  {
    "name": "sector_preference_rankings",
    "type": "array",
    "question": "How would you rank these sectors by importance?",
    "description": "Drag to reorder sectors based on your investment priorities."
  },
  {
    "name": "market_cap_preference",
    "type": "string",
    "question": "What market capitalization do you prefer?",
    "description": "Options might include 'large-cap', 'mid-cap', 'small-cap', or 'mixed'."
  },
  {
    "name": "growth_vs_value",
    "type": "string",
    "question": "Do you prefer growth stocks, value stocks, or a blend?",
    "description": "Indicate whether you lean toward fast-growing companies or undervalued stocks."
  },
  {
    "name": "dividend_preference",
    "type": "boolean",
    "question": "Are you interested in dividend-paying stocks?",
    "description": "Helps determine if you prefer income-generating investments."
  },
  {
    "name": "tech_sector_interest",
    "type": "boolean",
    "question": "Are you interested in investing in the technology sector?",
    "description": "Focus on companies in software, hardware, semiconductors, cybersecurity, etc."
  },
  {
    "name": "healthcare_sector_interest",
    "type": "boolean",
    "question": "Are you interested in investing in the healthcare sector?",
    "description": "Includes pharmaceuticals, biotech, medical devices, and healthcare services."
  },
  {
    "name": "financial_sector_interest",
    "type": "boolean",
    "question": "Are you interested in investing in the financial sector?",
    "description": "Covers banks, insurance companies, and other financial institutions."
  },
  {
    "name": "energy_sector_interest",
    "type": "boolean",
    "question": "Are you interested in investing in the energy sector?",
    "description": "Includes oil, gas, renewable energy companies, and related industries."
  },
  {
    "name": "consumer_goods_interest",
    "type": "boolean",
    "question": "Are you interested in investing in consumer goods companies?",
    "description": "Focuses on companies producing everyday consumer products."
  },
  {
    "name": "industrials_interest",
    "type": "boolean",
    "question": "Are you interested in investing in industrial companies?",
    "description": "Includes sectors like manufacturing, transportation, and logistics."
  },
  {
    "name": "emerging_markets_interest",
    "type": "boolean",
    "question": "Are you interested in stocks from emerging markets?",
    "description": "Specifies interest in stocks from developing economies."
  },
  {
    "name": "ESG_preference",
    "type": "boolean",
    "question": "Do you prefer stocks that meet ESG criteria?",
    "description": "Indicates if you favor companies with strong environmental, social, and governance practices."
  },
  {
    "name": "small_cap_interest",
    "type": "boolean",
    "question": "Are you interested in small-cap stocks?",
    "description": "Small-cap stocks may offer higher growth potential with increased volatility."
  },
  {
    "name": "blue_chip_interest",
    "type": "boolean",
    "question": "Are you interested in blue-chip stocks?",
    "description": "Indicates a preference for well-established companies with stable performance."
  },
  {
    "name": "cyclical_vs_defensive",
    "type": "string",
    "question": "Do you prefer cyclical stocks, defensive stocks, or a mix?",
    "description": "Cyclical stocks perform well during economic expansions, while defensive stocks offer stability during downturns."
  },
  {
    "name": "tech_subsectors_interest",
    "type": "array",
    "question": "Which technology subsectors are you interested in?",
    "description": "Examples include software, hardware, semiconductors, and cybersecurity."
  },
  {
    "name": "healthcare_subsectors_interest",
    "type": "array",
    "question": "Which healthcare subsectors are you interested in?",
    "description": "Examples include pharmaceuticals, biotech, medical devices, and healthcare services."
  },
  {
    "name": "investment_time_horizon",
    "type": "int",
    "question": "What is your investment time horizon in stocks (in years)?",
    "description": "Indicates the duration for which you plan to hold your stock investments."
  },
  {
    "name": "valuation_metrics_preference",
    "type": "string",
    "question": "Which valuation metrics do you prioritize when selecting stocks?",
    "description": "Examples include P/E ratio, P/B ratio, dividend yield, and others."
  },
  {
    "name": "has_trade_history",
    "type": "boolean",
    "question": "Do you have a buy/sell order history file?",
    "description": "If you have a trading history, we can use it to provide more personalized recommendations."
  },
  {
    "name": "trade_history_file",
    "type": "file",
    "question": "Please upload your trading history file",
    "description": "Upload a CSV file containing your trading history. This helps us analyze your past investment patterns."
  }
];

// List of available sectors for selection
const availableSectors = [
  "Technology", 
  "Healthcare", 
  "Finance", 
  "Energy", 
  "Consumer Goods", 
  "Industrials", 
  "Real Estate", 
  "Materials", 
  "Utilities", 
  "Communication Services"
];

// List of tech subsectors
const techSubsectors = [
  "Software", 
  "Hardware", 
  "Semiconductors", 
  "Cybersecurity", 
  "Cloud Computing", 
  "Artificial Intelligence", 
  "E-commerce", 
  "Fintech", 
  "Social Media"
];

// List of healthcare subsectors
const healthcareSubsectors = [
  "Pharmaceuticals", 
  "Biotechnology", 
  "Medical Devices", 
  "Healthcare Services", 
  "Health Insurance", 
  "Telemedicine", 
  "Diagnostics", 
  "Healthcare IT"
];

// Valuation metrics options
const valuationMetricsOptions = [
  "P/E Ratio", 
  "P/B Ratio", 
  "P/S Ratio", 
  "EV/EBITDA", 
  "Dividend Yield", 
  "ROE", 
  "ROA", 
  "Profit Margin"
];

// Draggable item component for the ranking system
const DraggableItem = ({ item, index, onDragStart, onDragEnter, onDragEnd, isDragging }) => {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`flex items-center p-3 mb-2 rounded-md bg-secondary
        ${isDragging === index ? 'opacity-50 border-2 border-dashed border-primary' : ''}
        ${isDragging !== null && isDragging !== index ? 'cursor-pointer' : ''}`}
    >
      <GripVertical className="h-5 w-5 mr-2 text-muted-foreground" />
      <span className="flex-grow">{item}</span>
      <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
    </div>
  );
};

const InvestmentQuestionnairePopup = ({ isOpen, onClose, onSubmit, preventOutsideClose = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [progress, setProgress] = useState(0);
  const [draggedItem, setDraggedItem] = useState(null);
  const [questionsData, setQuestionsData] = useState([]);
  const fileInputRef = useRef(null);

  // Build questionsData based on responses
  useEffect(() => {
    if (!isOpen) return;
    
    // Start with base questions
    let questions = [...baseQuestionsData];
    
    // If user is not an experienced investor, remove the trade history questions
    if (responses.is_experienced_investor === false) {
      questions = questions.filter(q => 
        q.name !== 'has_trade_history' && q.name !== 'trade_history_file'
      );
    }
    
    // If user doesn't have trade history, remove the file upload question
    if (responses.has_trade_history === false) {
      questions = questions.filter(q => q.name !== 'trade_history_file');
    }
    
    setQuestionsData(questions);
  }, [isOpen, responses.is_experienced_investor, responses.has_trade_history]);

  useEffect(() => {
    // Initialize responses with default values
    const initialResponses = {};
    baseQuestionsData.forEach(q => {
      if (q.type === 'array') initialResponses[q.name] = [];
      else if (q.type === 'object') initialResponses[q.name] = {};
      else if (q.type === 'boolean') initialResponses[q.name] = false;
      else if (q.type === 'int') initialResponses[q.name] = 5;
      else if (q.type === 'file') initialResponses[q.name] = null;
      else initialResponses[q.name] = '';
    });
    setResponses(initialResponses);
    setCurrentStep(0);
    setProgress(0);
  }, [isOpen]);

  useEffect(() => {
    // Update progress when step changes
    if (questionsData.length > 0) {
      setProgress(Math.round(((currentStep + 1) / questionsData.length) * 100));
    }
  }, [currentStep, questionsData.length]);

  // Handle dependencies between questions
  useEffect(() => {
    // If sectors are selected, update the ranking
    if (responses.preferred_sectors?.length > 0) {
      // If ranking doesn't exist or order has changed, update it
      if (!responses.sector_preference_rankings || 
          !arraysHaveSameElements(responses.sector_preference_rankings, responses.preferred_sectors)) {
        setResponses(prev => ({
          ...prev,
          sector_preference_rankings: [...responses.preferred_sectors]
        }));
      }
    } else {
      setResponses(prev => ({
        ...prev,
        sector_preference_rankings: []
      }));
    }
    
    // Show tech subsectors only if tech sector is selected
    if (!responses.preferred_sectors?.includes('Technology')) {
      setResponses(prev => ({
        ...prev,
        tech_subsectors_interest: []
      }));
    }
    
    // Show healthcare subsectors only if healthcare sector is selected
    if (!responses.preferred_sectors?.includes('Healthcare')) {
      setResponses(prev => ({
        ...prev,
        healthcare_subsectors_interest: []
      }));
    }
  }, [responses.preferred_sectors]);

  const arraysHaveSameElements = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return sorted1.every((value, index) => value === sorted2[index]);
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isCurrentQuestionAnswered = () => {
    const question = questionsData[currentStep];
    if (!question) return true;
    
    switch (question.type) {
      case 'array':
        // For array types, require at least one selection
        // Exception: sector_preference_rankings is automatically populated
        if (question.name === 'sector_preference_rankings') return true;
        return responses[question.name]?.length > 0;
      
      case 'string':
        return !!responses[question.name];
      
      case 'int':
        return responses[question.name] !== undefined && responses[question.name] !== null;
      
      case 'file':
        // Only required if we're at the file upload question
        return responses[question.name] !== null && responses[question.name] !== undefined;
      
      case 'boolean':
        // Boolean is always answered (default is false)
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    // Check if current question is answered
    if (!isCurrentQuestionAnswered()) {
      alert('Please answer the current question before proceeding.');
      return;
    }
    
    if (currentStep < questionsData.length - 1) {
      // Skip sector rankings if no sectors selected
      if (questionsData[currentStep + 1].name === 'sector_preference_rankings' && 
          responses.preferred_sectors?.length === 0) {
        setCurrentStep(currentStep + 2);
      }
      // Skip tech subsectors if not interested in tech
      else if (questionsData[currentStep + 1].name === 'tech_subsectors_interest' && 
               !responses.preferred_sectors?.includes('Technology')) {
        setCurrentStep(currentStep + 2);
      }
      // Skip healthcare subsectors if not interested in healthcare
      else if (questionsData[currentStep + 1].name === 'healthcare_subsectors_interest' && 
               !responses.preferred_sectors?.includes('Healthcare')) {
        setCurrentStep(currentStep + 2);
      }
      else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Function to convert CSV to JSON
  const convertCSVtoJSON = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csvText = event.target.result;
          const lines = csvText.split('\n');
          const headers = lines[0].split(',').map(header => header.trim());
          
          const jsonArray = [];
          
          // Start from line 1 (skip headers)
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip empty lines
            
            const values = line.split(',');
            const entry = {};
            
            // Assign values to corresponding headers
            for (let j = 0; j < headers.length; j++) {
              entry[headers[j]] = values[j]?.trim() || '';
            }
            
            jsonArray.push(entry);
          }
          
          resolve(jsonArray);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      
      reader.readAsText(file);
    });
  };

  const handleSubmit = async () => {
    // Check if current question is answered
    if (!isCurrentQuestionAnswered()) {
      alert('Please answer the current question before submitting.');
      return;
    }
    
    try {
      // Create a copy of the responses to modify
      const finalResponses = { ...responses };
      
      // If there's a trade history file, convert it to JSON
      if (finalResponses.trade_history_file) {
        const jsonData = await convertCSVtoJSON(finalResponses.trade_history_file);
        
        // Add the parsed JSON data as a new field
        finalResponses.trade_history_data = jsonData;
        
        // Remove the File object as it's not needed anymore
        // and can't be easily serialized/sent to backend
        delete finalResponses.trade_history_file;
      }
      
      // Submit the final responses
      onSubmit(finalResponses);
      onClose();
    } catch (error) {
      console.error('Error processing CSV file:', error);
      alert('There was an error processing your CSV file. Please check the format and try again.');
    }
  };

  const handleInputChange = (name, value) => {
    setResponses(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayToggle = (name, value) => {
    setResponses(prev => {
      const currentArray = [...(prev[name] || [])];
      const index = currentArray.indexOf(value);
      
      if (index >= 0) {
        currentArray.splice(index, 1);
      } else {
        currentArray.push(value);
      }
      
      return {
        ...prev,
        [name]: currentArray
      };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResponses(prev => ({
        ...prev,
        trade_history_file: file
      }));
    }
  };

  // Drag and drop handlers for ranking
  const handleDragStart = (index) => {
    setDraggedItem(index);
  };

  const handleDragEnter = (index) => {
    if (draggedItem === null || draggedItem === index) return;
    
    setResponses(prev => {
      const newRankings = [...prev.sector_preference_rankings];
      const draggedItemValue = newRankings[draggedItem];
      
      // Remove the dragged item
      newRankings.splice(draggedItem, 1);
      
      // Insert it at the new position
      newRankings.splice(index, 0, draggedItemValue);
      
      return {
        ...prev,
        sector_preference_rankings: newRankings
      };
    });
    
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Get the current question
  const currentQuestion = questionsData[currentStep];

  // Render the appropriate input based on the question type
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;
    
    switch (currentQuestion.name) {
      case 'is_experienced_investor':
      case 'has_trade_history':
      case 'dividend_preference':
      case 'tech_sector_interest':
      case 'healthcare_sector_interest':
      case 'financial_sector_interest':
      case 'energy_sector_interest':
      case 'consumer_goods_interest':
      case 'industrials_interest':
      case 'emerging_markets_interest':
      case 'ESG_preference':
      case 'small_cap_interest':
      case 'blue_chip_interest':
        // Boolean questions
        return (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              onClick={() => handleInputChange(currentQuestion.name, true)}
              className={`p-3 rounded-md text-center
                ${responses[currentQuestion.name] === true 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary hover:bg-secondary/80'}`}
            >
              Yes
            </button>
            <button
              onClick={() => handleInputChange(currentQuestion.name, false)}
              className={`p-3 rounded-md text-center
                ${responses[currentQuestion.name] === false 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary hover:bg-secondary/80'}`}
            >
              No
            </button>
          </div>
        );
      
      case 'preferred_sectors':
        return (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {availableSectors.map(sector => (
              <button
                key={sector}
                onClick={() => handleArrayToggle(currentQuestion.name, sector)}
                className={`p-3 rounded-md text-left flex items-center 
                  ${responses[currentQuestion.name]?.includes(sector) 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80'}`}
              >
                <span className="flex-grow">{sector}</span>
                {responses[currentQuestion.name]?.includes(sector) && (
                  <Check className="h-5 w-5" />
                )}
              </button>
            ))}
          </div>
        );
      
      case 'sector_preference_rankings':
        return (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Drag to reorder sectors based on your priorities:</p>
            <div className="space-y-1">
              {responses.sector_preference_rankings.map((sector, index) => (
                <DraggableItem
                  key={sector}
                  item={sector}
                  index={index}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedItem}
                />
              ))}
            </div>
          </div>
        );
        
      case 'market_cap_preference':
        return (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {['Large-cap', 'Mid-cap', 'Small-cap', 'Mixed'].map(option => (
              <button
                key={option}
                onClick={() => handleInputChange(currentQuestion.name, option.toLowerCase())}
                className={`p-3 rounded-md text-left flex items-center
                  ${responses[currentQuestion.name] === option.toLowerCase() 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80'}`}
              >
                <span className="flex-grow">{option}</span>
                {responses[currentQuestion.name] === option.toLowerCase() && (
                  <Check className="h-5 w-5" />
                )}
              </button>
            ))}
          </div>
        );

      case 'growth_vs_value':
        return (
          <div className="grid grid-cols-1 gap-2 mt-4">
            {['Growth', 'Value', 'Blend'].map(option => (
              <button
                key={option}
                onClick={() => handleInputChange(currentQuestion.name, option.toLowerCase())}
                className={`p-3 rounded-md text-left flex items-center
                  ${responses[currentQuestion.name] === option.toLowerCase() 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80'}`}
              >
                <span className="flex-grow">{option}</span>
                {responses[currentQuestion.name] === option.toLowerCase() && (
                  <Check className="h-5 w-5" />
                )}
              </button>
            ))}
          </div>
        );
      
      case 'cyclical_vs_defensive':
        return (
          <div className="grid grid-cols-1 gap-2 mt-4">
            {['Cyclical', 'Defensive', 'Mixed'].map(option => (
              <button
                key={option}
                onClick={() => handleInputChange(currentQuestion.name, option.toLowerCase())}
                className={`p-3 rounded-md text-left flex items-center
                  ${responses[currentQuestion.name] === option.toLowerCase() 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80'}`}
              >
                <span className="flex-grow">{option}</span>
                {responses[currentQuestion.name] === option.toLowerCase() && (
                  <Check className="h-5 w-5" />
                )}
              </button>
            ))}
          </div>
        );
      
      case 'tech_subsectors_interest':
        return (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {techSubsectors.map(subsector => (
              <button
                key={subsector}
                onClick={() => handleArrayToggle(currentQuestion.name, subsector)}
                className={`p-3 rounded-md text-left flex items-center 
                  ${responses[currentQuestion.name]?.includes(subsector) 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80'}`}
              >
                <span className="flex-grow">{subsector}</span>
                {responses[currentQuestion.name]?.includes(subsector) && (
                  <Check className="h-5 w-5" />
                )}
              </button>
            ))}
          </div>
        );
      
      case 'healthcare_subsectors_interest':
        return (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {healthcareSubsectors.map(subsector => (
              <button
                key={subsector}
                onClick={() => handleArrayToggle(currentQuestion.name, subsector)}
                className={`p-3 rounded-md text-left flex items-center 
                  ${responses[currentQuestion.name]?.includes(subsector) 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80'}`}
              >
                <span className="flex-grow">{subsector}</span>
                {responses[currentQuestion.name]?.includes(subsector) && (
                  <Check className="h-5 w-5" />
                )}
              </button>
            ))}
          </div>
        );
      
      case 'investment_time_horizon':
        return (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">1 year</span>
              <span className="text-sm">10+ years</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={responses[currentQuestion.name] || 5}
              onChange={(e) => handleInputChange(currentQuestion.name, parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center font-medium text-lg">
              {responses[currentQuestion.name] || 5} year{responses[currentQuestion.name] !== 1 ? 's' : ''}
            </div>
          </div>
        );
      
      case 'valuation_metrics_preference':
        return (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {valuationMetricsOptions.map(metric => (
              <button
                key={metric}
                onClick={() => handleInputChange(currentQuestion.name, metric)}
                className={`p-3 rounded-md text-left flex items-center
                  ${responses[currentQuestion.name] === metric 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80'}`}
              >
                <span className="flex-grow">{metric}</span>
                {responses[currentQuestion.name] === metric && (
                  <Check className="h-5 w-5" />
                )}
              </button>
            ))}
          </div>
        );
      
      case 'trade_history_file':
        return (
          <div className="mt-4">
            <div 
              className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                {responses.trade_history_file ? responses.trade_history_file.name : 'Click to upload your CSV file'}
              </p>
              <p className="text-xs text-muted-foreground">
                {responses.trade_history_file 
                  ? `${(responses.trade_history_file.size / 1024).toFixed(2)} KB` 
                  : 'CSV files only'}
              </p>
            </div>
            {responses.trade_history_file && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => setResponses(prev => ({ ...prev, trade_history_file: null }))}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Remove file
                </button>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="mt-4">
            <input
              type="text"
              value={responses[currentQuestion.name] || ''}
              onChange={(e) => handleInputChange(currentQuestion.name, e.target.value)}
              className="w-full p-3 border rounded-md"
              placeholder="Enter your response..."
            />
          </div>
        );
    }
  };

  if (!isOpen || !currentQuestion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={preventOutsideClose ? () => {} : onClose}
      ></div>
      
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-auto">
        {/* Header with close button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Investment Preferences</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-secondary rounded-full h-2 mb-6">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Question content */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-2">{currentQuestion.question}</h3>
          <p className="text-sm text-muted-foreground mb-2">{currentQuestion.description}</p>
          
          {/* Show selection type indicator */}
          {currentQuestion.type === 'array' && currentQuestion.name !== 'sector_preference_rankings' && (
            <div className="text-xs font-medium bg-secondary/70 text-secondary-foreground inline-block px-2 py-1 rounded mb-4">
              Multiple selections allowed
            </div>
          )}
          
          {renderQuestionInput()}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-md flex items-center
              ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary'}`}
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Previous
          </button>
          
          {currentStep < questionsData.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!isCurrentQuestionAnswered()}
              className={`px-4 py-2 rounded-md flex items-center
                ${isCurrentQuestionAnswered() 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-primary/50 text-primary-foreground/50 cursor-not-allowed'}`}
            >
              Next
              <ChevronRight className="h-5 w-5 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isCurrentQuestionAnswered()}
              className={`px-4 py-2 rounded-md
                ${isCurrentQuestionAnswered() 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-primary/50 text-primary-foreground/50 cursor-not-allowed'}`}
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentQuestionnairePopup;