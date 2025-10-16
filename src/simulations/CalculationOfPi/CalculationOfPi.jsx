import { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Slider, Button, Grid } from '@mui/material';
import * as d3 from 'd3';
import { simulationStyles } from '../../styles/simulationStyles';

const CalculationOfPi = () => {
  // State variables
  const [ratio, setRatio] = useState(1.0);
  const [isRunning, setIsRunning] = useState(false);
  const [calculatedPi, setCalculatedPi] = useState(0);
  const [error, setError] = useState(0);
  const [errorHistory, setErrorHistory] = useState([]);
  const [points, setPoints] = useState([]);
  const [currentSimulation, setCurrentSimulation] = useState(0);
  const [simulationResults, setSimulationResults] = useState([]);

  // Constants
  const realPi = Math.PI;
  const simulationSteps = [100, 200, 300, 400, 500, 1000, 2000, 3000, 4000,
    5000, 10000, 20000, 30000, 40000, 50000, 100000, 500000, 1000000];

  // Refs for D3 visualization
  const svgRef = useRef(null);
  const errorGraphRef = useRef(null);

  const generateRandomPoint = () => {
    const x = (Math.random() - 0.5) * ratio;
    const y = (Math.random() - 0.5) * ratio;
    return {
      x,
      y,
      isInside: Math.sqrt(x * x + y * y) < 0.5 * ratio
    };
  };

  const runSimulation = async (numPoints) => {
    let insideCircle = 0;
    let newPoints = [];
    const samplingRate = numPoints > 10000 ? Math.floor(numPoints / 5000) : 1;

    for (let i = 0; i < numPoints; i++) {
      // Generate points in the scaled square
      const x = (Math.random() * 2 - 1) * ratio / 2;
      const y = (Math.random() * 2 - 1) * ratio / 2;
      const distance = Math.sqrt(x * x + y * y);

      if (distance <= 0.5) { // Circle radius is 0.5 when square is 1x1
        insideCircle++;
      }

      // Store only a fraction of points for visualization
      if (i % samplingRate === 0) {
        newPoints.push({ x, y, inside: distance <= 0.5 });
      }
    }

    const piEstimate = (4.0 * insideCircle) / numPoints;
    const relativeError = Math.abs(piEstimate - realPi) / realPi;

    setCalculatedPi(piEstimate);
    setError(relativeError);
    setPoints(newPoints);
    setErrorHistory(prev => [...prev, { trials: numPoints, error: relativeError }]);
    setSimulationResults(prev => [...prev, {
      trials: numPoints,
      pi: piEstimate,
      error: relativeError
    }]);
  };

  const startSimulations = async () => {
    setIsRunning(true);
    setErrorHistory([]);
    setSimulationResults([]);

    for (let i = 0; i < simulationSteps.length; i++) {
      setCurrentSimulation(i);
      await new Promise(resolve => setTimeout(resolve, 100)); // Allow UI to update
      await runSimulation(simulationSteps[i]);
    }

    setIsRunning(false);
    setCurrentSimulation(-1);
  };

  // D3 visualization setup
  useEffect(() => {
    if (!svgRef.current) return;

    const width = 400;
    const height = 400;
    const svg = d3.select(svgRef.current);

    // Clear previous SVG
    svg.selectAll("*").remove();

    // Scale for points - adjust domain based on ratio
    const scale = d3.scaleLinear()
      .domain([-ratio/2, ratio/2])
      .range([0, width]);

    // Draw bounding square
    svg.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "none")
      .attr("stroke", simulationStyles.plot.gridColor)
      .attr("stroke-width", simulationStyles.plot.lineThickness.thin);

    // Draw coordinate axes
    svg.append("line") // x-axis
      .attr("x1", 0)
      .attr("y1", height/2)
      .attr("x2", width)
      .attr("y2", height/2)
      .attr("stroke", simulationStyles.plot.gridColor)
      .attr("stroke-width", simulationStyles.plot.lineThickness.thin);

    svg.append("line") // y-axis
      .attr("x1", width/2)
      .attr("y1", 0)
      .attr("x2", width/2)
      .attr("y2", height)
      .attr("stroke", simulationStyles.plot.gridColor)
      .attr("stroke-width", simulationStyles.plot.lineThickness.thin);

    // Add axes labels
    svg.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height + 10)
      .attr("text-anchor", "middle")
      .attr("fill", simulationStyles.text.axisLabel.color)
      .attr("font-size", simulationStyles.text.axisLabel.size)
      .text("x");

    svg.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .attr("fill", simulationStyles.text.axisLabel.color)
      .attr("font-size", simulationStyles.text.axisLabel.size)
      .text("y");

    // Draw circle with radius 0.5 in the scaled coordinate system
    svg.append("circle")
      .attr("cx", width/2)
      .attr("cy", height/2)
      .attr("r", width/(2*ratio)) // Scale circle radius based on ratio
      .attr("fill", "none")
      .attr("stroke", simulationStyles.plot.primaryColor)
      .attr("stroke-width", simulationStyles.plot.lineThickness.medium);

    // Plot points
    svg.selectAll("circle.point")
      .data(points)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", d => scale(d.x))
      .attr("cy", d => scale(-d.y)) // Flip y-axis to match mathematical convention
      .attr("r", 2)
      .attr("fill", d => d.inside ? simulationStyles.plot.secondaryColor : simulationStyles.plot.tertiaryColor)
      .attr("opacity", 0.6);

    // Add corner coordinates
    const corners = [
      { x: -ratio/2, y: ratio/2, label: `(-${ratio/2}, ${ratio/2})` },
      { x: ratio/2, y: ratio/2, label: `(${ratio/2}, ${ratio/2})` },
      { x: -ratio/2, y: -ratio/2, label: `(-${ratio/2}, -${ratio/2})` },
      { x: ratio/2, y: -ratio/2, label: `(${ratio/2}, -${ratio/2})` }
    ];

    svg.selectAll("text.corner")
      .data(corners)
      .enter()
      .append("text")
      .attr("class", "corner")
      .attr("x", d => scale(d.x))
      .attr("y", d => scale(-d.y))
      .attr("dx", d => d.x < 0 ? -5 : 5)
      .attr("dy", d => d.y < 0 ? 15 : -5)
      .attr("text-anchor", d => d.x < 0 ? "end" : "start")
      .text(d => d.label)
      .attr("fill", simulationStyles.text.axisLabel.color)
      .attr("font-size", simulationStyles.text.axisLabel.size);

  }, [points, ratio]); // Add ratio to dependencies

  // Error graph visualization
  useEffect(() => {
    if (!errorGraphRef.current) return;

    const width = 400;
    const height = 200;
    const margin = 40;

    // Clear previous SVG
    d3.select(errorGraphRef.current).selectAll("*").remove();

    const svg = d3.select(errorGraphRef.current)
      .attr("width", width + 2 * margin)
      .attr("height", height + 2 * margin)
      .append("g")
      .attr("transform", `translate(${margin},${margin})`);

    // Fixed scales for engineering analysis
    const xScale = d3.scaleLog()
      .domain([1e2, 1e6]) // Fixed from 100 to 1,000,000
      .range([0, width]);

    const yScale = d3.scaleLog()
      .domain([1e-5, 1e-1]) // Fixed from 10^-5 to 10^-1
      .range([height, 0]);

    // Format ticks in scientific notation
    const formatPower = (d) => {
      return `${d.toExponential(0)}`;
    };

    // Add vertical grid
    const xGridTicks = [1e2, 1e3, 1e4, 1e5, 1e6];
    svg.selectAll("grid.vertical")
      .data(xGridTicks)
      .enter()
      .append("line")
      .attr("class", "grid")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", simulationStyles.plot.gridColor)
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.3);

    // Add horizontal grid
    const yGridTicks = [1e-5, 1e-4, 1e-3, 1e-2, 1e-1];
    svg.selectAll("grid.horizontal")
      .data(yGridTicks)
      .enter()
      .append("line")
      .attr("class", "grid")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", simulationStyles.plot.gridColor)
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.3);

    // Add axes with scientific notation
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickValues(xGridTicks)
        .tickFormat(formatPower))
      .call(g => {
        g.selectAll("text")
          .attr("fill", simulationStyles.text.axisLabel.color)
          .attr("font-size", simulationStyles.text.axisLabel.size);
        g.selectAll("line")
          .attr("stroke", simulationStyles.plot.gridColor);
        g.selectAll("path")
          .attr("stroke", simulationStyles.plot.gridColor);
      })
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + margin - 5)
      .attr("text-anchor", "middle")
      .attr("fill", simulationStyles.text.axisLabel.color)
      .attr("font-size", simulationStyles.text.axisLabel.size)
      .text("Number of Trials");

    svg.append("g")
      .call(d3.axisLeft(yScale)
        .tickValues(yGridTicks)
        .tickFormat(formatPower))
      .call(g => {
        g.selectAll("text")
          .attr("fill", simulationStyles.text.axisLabel.color)
          .attr("font-size", simulationStyles.text.axisLabel.size);
        g.selectAll("line")
          .attr("stroke", simulationStyles.plot.gridColor);
        g.selectAll("path")
          .attr("stroke", simulationStyles.plot.gridColor);
      })
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin + 15)
      .attr("text-anchor", "middle")
      .attr("fill", simulationStyles.text.axisLabel.color)
      .attr("font-size", simulationStyles.text.axisLabel.size)
      .text("Relative Error");

    // Add theoretical n^(-1/2) convergence line
    const convergenceLine = d3.line()
      .x(d => xScale(d))
      .y(d => yScale(0.5 / Math.sqrt(d)));

    const theoreticalPoints = xGridTicks;

    svg.append("path")
      .datum(theoreticalPoints)
      .attr("fill", "none")
      .attr("stroke", simulationStyles.plot.tertiaryColor)
      .attr("stroke-width", simulationStyles.plot.lineThickness.thin)
      .attr("stroke-dasharray", "4,4")
      .attr("d", convergenceLine)
      .attr("opacity", 0.8);

    // Add legend for theoretical line
    svg.append("text")
      .attr("x", width - 60)
      .attr("y", 20)
      .attr("fill", simulationStyles.text.axisLabel.color)
      .attr("font-size", simulationStyles.text.ticks.size)
      .text("∝ n⁻¹/²");

    // Add error points for actual data
    if (errorHistory.length > 0) {
      // Add points
      svg.selectAll("circle.error-point")
        .data(errorHistory)
        .enter()
        .append("circle")
        .attr("class", "error-point")
        .attr("cx", d => xScale(d.trials))
        .attr("cy", d => yScale(d.error))
        .attr("r", 4)
        .attr("fill", simulationStyles.plot.primaryColor)
        .attr("stroke", "none");

      // Add error bars (optional)
      const errorBarWidth = 4;
      svg.selectAll("line.error-bar")
        .data(errorHistory)
        .enter()
        .append("line")
        .attr("class", "error-bar")
        .attr("x1", d => xScale(d.trials) - errorBarWidth)
        .attr("x2", d => xScale(d.trials) + errorBarWidth)
        .attr("y1", d => yScale(d.error))
        .attr("y2", d => yScale(d.error))
        .attr("stroke", simulationStyles.plot.primaryColor)
        .attr("stroke-width", 2);
    }

  }, [errorHistory]);

  // Results table styles
  const tableStyles = {
    container: {
      overflowY: 'auto',
      marginTop: simulationStyles.spacing.margin.medium,
      marginBottom: simulationStyles.spacing.margin.medium,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      ...simulationStyles.text.body
    },
    th: {
      position: 'sticky',
      top: 0,
      padding: simulationStyles.spacing.padding.small,
      color: simulationStyles.text.title.color,
      backgroundColor: 'transparent'
    },
    td: {
      padding: simulationStyles.spacing.padding.small,
      textAlign: 'center',
      borderBottom: '1px solid rgba(167, 201, 255, 0.1)'
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom sx={{ 
        color: simulationStyles.text.title.color,
        fontFamily: simulationStyles.text.title.fontFamily 
      }}>
        Monte Carlo Calculation of π
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box sx={{
            ...simulationStyles.controlBox,
            backgroundColor: simulationStyles.background.primary,
            padding: 2,
            borderRadius: 2
          }}>
            {/* Ratio Selector */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ 
                ...simulationStyles.text.body,
                mb: 1 
              }}>
                Square Size (l/d): {ratio.toFixed(2)}
              </Typography>
              <Slider
                value={ratio}
                onChange={(_, value) => setRatio(value)}
                min={1}
                max={2}
                step={0.1}
                sx={{
                  color: simulationStyles.plot.primaryColor,
                  '& .MuiSlider-thumb': {
                    backgroundColor: simulationStyles.plot.secondaryColor,
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: simulationStyles.plot.primaryColor,
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: simulationStyles.plot.gridColor,
                  }
                }}
              />
            </Box>

            <Button
              variant="contained"
              onClick={startSimulations}
              disabled={isRunning}
              sx={{ mb: 2 }}
            >
              {isRunning ? 'Running...' : 'Start Simulation'}
            </Button>

            {/* Error Convergence Graph */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <svg ref={errorGraphRef} width={600 + 2 * 40} height={200 + 2 * 40}></svg>
            </Box>

            {/* Results Table */}
            <Box sx={tableStyles.container}>
              <table style={tableStyles.table}>
                <thead>
                  <tr>
                    <th style={{
                      ...tableStyles.th,
                      fontSize: simulationStyles.text.body.size
                    }}>Trials</th>
                    <th style={{
                      ...tableStyles.th,
                      fontSize: simulationStyles.text.body.size
                    }}>π Estimate</th>
                    <th style={{
                      ...tableStyles.th,
                      fontSize: simulationStyles.text.body.size
                    }}>Relative Error</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationResults.map((result, index) => (
                    <tr key={index}>
                      <td style={tableStyles.td}>{result.trials.toLocaleString()}</td>
                      <td style={tableStyles.td}>{result.pi.toFixed(6)}</td>
                      <td style={tableStyles.td}>{result.error.toExponential(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <svg ref={svgRef} width={400} height={400}></svg>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CalculationOfPi;