import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import jsonData from './interviewData.json'; // Import the JSON data file
import _ from 'lodash'; // Import lodash library for pagination

const DataTable = () => {
  const [data, setData] = useState([]);
  const [selectedData, setSelectedData] = useState(() => {
    const storedData = localStorage.getItem('selectedData');
    return storedData ? JSON.parse(storedData) : [];
  });
  const [chartData, setChartData] = useState({
    x: [],
    y: [],
    type: 'bar',
    marker: { color: [] },
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [numToShow, setNumToShow] = useState(5);

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, numToShow]);

  useEffect(() => {
    updateChartData();

    localStorage.setItem('selectedData', JSON.stringify(selectedData));
  }, [selectedData]);

  const fetchData = () => {
    // Filter data based on search term
    let filteredData = jsonData.filter(
      (item) =>
        item.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.interview_question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.candidate_response.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Paginate data
    const startIndex = (currentPage - 1) * numToShow;
    const paginatedData = _.chunk(filteredData, numToShow);
    const selectedPageData = paginatedData[currentPage - 1] || [];

    setData(selectedPageData);
    setTotalPages(paginatedData.length);
  };

  const updateChartData = () => {
    const prevXValues = chartData.x;
    const prevYValues = chartData.y;

    const newXValues = selectedData.map((row) => row.candidate_name);
    const newYValues = selectedData.map((row) => row.ai_generated_score);

    const addedXValues = newXValues.filter((x) => !prevXValues.includes(x));
    const addedYValues = newYValues.filter((y) => !prevYValues.includes(y));

    const newColors = Array.from({ length: addedXValues.length }, () => getRandomColor());

    const updatedXValues = [...prevXValues, ...addedXValues];
    const updatedYValues = [...prevYValues, ...addedYValues];
    const updatedColors = [...chartData.marker.color, ...newColors];

    setChartData({
      x: updatedXValues,
      y: updatedYValues,
      type: 'bar',
      marker: {
        color: updatedColors,
        line: {
          color: 'rgba(255, 255, 255, 0.7)',
          width: 1.5,
        },
      },
      hoverinfo: 'y+text',
      hovertext: selectedData.map((row) => `Score: ${row.ai_generated_score}`),
    });
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleCheckboxChange = (id) => {
    const updatedData = data.find((row) => row.candidate_name === id);

    if (selectedData.some((row) => row.candidate_name === id)) {
      setSelectedData((prevData) => prevData.filter((row) => row.candidate_name !== id));
      setChartData((prevChartData) => {
        const updatedXValues = prevChartData.x.filter((x) => x !== updatedData.candidate_name);
        const updatedYValues = prevChartData.y.filter((y) => y !== updatedData.ai_generated_score);
        const updatedColors = prevChartData.marker.color.filter((_, index) => {
          return prevChartData.x[index] !== updatedData.candidate_name;
        });
        return {
          ...prevChartData,
          x: updatedXValues,
          y: updatedYValues,
          marker: {
            ...prevChartData.marker,
            color: updatedColors,
          },
        };
      });
    } else {
      setSelectedData((prevData) => [...prevData, updatedData]);
      setChartData((prevChartData) => ({
        ...prevChartData,
        x: [...prevChartData.x, updatedData.candidate_name],
        y: [...prevChartData.y, updatedData.ai_generated_score],
        marker: {
          ...prevChartData.marker,
          color: [...prevChartData.marker.color, getRandomColor()],
        },
      }));
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const totalPagesArray = Array.from({ length: totalPages }, (_, i) => i + 1);

  const handleNumToShowChange = (value) => {
    setNumToShow(value);
  };

  return (
    <div className="container mx-auto my-8 p-8 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded shadow-2xl">
      <div className="mb-4 items-center space-x-4">
        <span className="text-sm text-gray-600">Page:</span>
        {totalPagesArray.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`p-2 rounded ${page === currentPage ? 'bg-blue-500 text-white' : 'bg-white text-black'
              }`}
          >
            {page}
          </button>
        ))}
        <div className="mt-2">
          <input
            type="text"
            placeholder="Number of items to show"
            value={numToShow}
            onChange={(e) => handleNumToShowChange(e.target.value)}
            className="p-2 mr-2 border border-white rounded bg-opacity-70 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="p-2 border border-white rounded bg-opacity-70 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex">
        <div className="w-1/2 p-4">
          <table className="table-auto bg-white bg-opacity-70 shadow-md rounded-md w-full">
            <thead>
              <tr>
                <th className="p-2"></th>
                <th className="p-2">Candidate Name</th>
                <th className="p-2">Interview Question</th>
                <th className="p-2">Candidate Response</th>
                <th className="p-2">AI Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.candidate_name}>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedData.some((selectedRow) => selectedRow.candidate_name === row.candidate_name)}
                      onChange={() => handleCheckboxChange(row.candidate_name)}
                    />
                  </td>
                  <td className="p-2">{row.candidate_name}</td>
                  <td className="p-2">{row.interview_question}</td>
                  <td className="p-2">{row.candidate_response}</td>
                  <td className="p-2">{row.ai_generated_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="w-1/2 p-4 bg-white bg-opacity-70 shadow-md rounded-md">
          <Plot
            data={[chartData]}
            layout={{ width: 550, height: 400, paper_bgcolor: 'rgba(255,255,255,0.8)', plot_bgcolor: 'rgba(255,255,255,0.8)' }}
          />
        </div>
      </div>
    </div>
  );
};

export default DataTable;
