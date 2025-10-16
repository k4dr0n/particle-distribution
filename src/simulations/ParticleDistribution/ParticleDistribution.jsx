import { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Slider, Button, Grid } from '@mui/material';
import * as d3 from 'd3';
import { simulationStyles } from '../../styles/simulationStyles';

const ParticleDistribution = () => {
  // Constants
  const MIN_PARTICLES = 100;
  const MIN_COMPARTMENTS = 2;
  const MAX_COMPARTMENTS = 20;
  const INI_COMPARTMENTS = 10;
  const MAX_PARTICLES = 1000;
  const PARTICLE_STEP = 100;
  const MAX_SIMULATIONS = 1000;
  const INI_MAX_POSSIBLE = Math.ceil(1+2.5*MIN_PARTICLES / INI_COMPARTMENTS);

  // State variables
  const [numParticles, setNumParticles] = useState(MIN_PARTICLES);
  const [numCompartments, setNumCompartments] = useState(INI_COMPARTMENTS);
  const [maxPossibleParticles, setmaxPossibleParticles] = useState(INI_MAX_POSSIBLE);
  const [distribution, setDistribution] = useState([]);
  const [accumulatedSum, setAccumulatedSum] = useState([]);
  const [accumulatedData, setAccumulatedData] = useState([]);
  const [particleFrequencies, setParticleFrequencies] = useState([]);
  const [analyticalDistribution, setAnalyticalDistribution] = useState([]);
  const [analyticalFrequencies, setAnalyticalFrequencies] = useState([]);
  const [accumulatedFreqSum, setAccumulatedFreqSum] = useState([]);
  const [simulationCount, setSimulationCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const svgRef = useRef(null);
  const freqSvgRef = useRef(null);

  // Calculate maximum possible particles in a compartment for current settings

  // Function to calculate factorial logarithm (from original Fortran code)
  const lnFactorial = (n) => {
    let result = 0;
    for (let j = 2; j <= n; j++) {
      result += Math.log(j);
    }
    return result;
  };

  // Function to calculate analytical distribution
  const calculateAnalyticalDistribution = (n, p, j) => {
    return Math.exp(
      lnFactorial(n) - lnFactorial(j) - lnFactorial(n - j) -
      j * Math.log(p) - (n - j) * Math.log(p / (p - 1))
    );
  };

  // Calculate analytical distribution when parameters change
  useEffect(() => {
    const p = 1.0 / numCompartments;
    const analyticalDist = Array.from({ length: maxPossibleParticles }, (_, i) => 
      calculateAnalyticalDistribution(numParticles, p, i)
    );
    // Normalize the analytical distribution (make it sum to 1)
    const sum = analyticalDist.reduce((a, b) => a + b, 0);
    const notNormalizedDist = analyticalDist.map(value => value / 1.0);
    setAnalyticalDistribution(analyticalDist);
  }, [numParticles, numCompartments, maxPossibleParticles]);

  // Function to simulate particle distribution
  const simulateDistribution = () => {
    const compartments = new Array(numCompartments).fill(0);
    
    // Distribute particles randomly
    for (let i = 0; i < numParticles; i++) {
      const randomCompartment = Math.floor(Math.random() * numCompartments);
      compartments[randomCompartment]++;
    }
    
    // Update accumulated sums and average
    setSimulationCount(prev => prev + 1);
    setAccumulatedSum(prev => {
      if (prev.length === 0) {
        return [...compartments];
      }
      return prev.map((sum, idx) => sum + compartments[idx]);
    });

    // Update particle frequency distribution
    const frequencies = new Array(maxPossibleParticles + 1).fill(0);
    compartments.forEach(count => {
      if (count <= maxPossibleParticles) frequencies[count]++;
    });

    setParticleFrequencies(frequencies);
    setAccumulatedFreqSum(prev => {
      if (prev.every(v => v === 0)) {
        return [...frequencies];
      }
      return prev.map((sum, idx) => sum + frequencies[idx]);
    });
    
    setDistribution(compartments);
  };

  // Calculate accumulated average whenever accumulatedSum changes
  useEffect(() => {
    if (simulationCount > 0) {
      setAccumulatedData(
        accumulatedSum.map(sum => sum / simulationCount)
      );
    }
  }, [accumulatedSum, simulationCount]);

  // Reset simulation
  const resetSimulation = () => {
    setDistribution([]);
    setAccumulatedSum([]);
    setAccumulatedData([]);
    setParticleFrequencies([]);
    setAccumulatedFreqSum([]);
    setSimulationCount(0);
    setmaxPossibleParticles(Math.ceil(1+2.5*numParticles / numCompartments));
  };

  // Effect for bar chart visualization
  useEffect(() => {
    if (!svgRef.current || distribution.length === 0) return;

    const width = 600;
    const height = 400;
    const margin = simulationStyles.chart.margin;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Add title style
    svg.append("style").text(`
      .axis-label { 
        font-size: ${simulationStyles.text.axisLabel.size}; 
        fill: ${simulationStyles.text.axisLabel.color};
      }
      .legend-text { 
        font-size: ${simulationStyles.text.legend.size}; 
        fill: ${simulationStyles.text.legend.color};
      }
      .tick text { 
        font-size: ${simulationStyles.text.ticks.size}; 
        fill: ${simulationStyles.text.ticks.color};
      }
    `);

    // Create scales
    const x = d3.scaleBand()
      .domain(d3.range(1, numCompartments + 1))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, maxPossibleParticles])
      .range([height - margin.bottom, margin.top]);

    // Add bars for current distribution
    svg.selectAll("rect.current")
      .data(distribution)
      .join("rect")
      .attr("class", "current")
      .attr("x", (d, i) => x(i + 1))
      .attr("y", d => y(d))
      .attr("width", x.bandwidth())
      .attr("height", d => height - margin.bottom - y(d))
      .attr("fill", simulationStyles.plot.primaryColor)
      .attr("opacity", simulationStyles.plot.opacity.medium);

    // Add line for accumulated average
    if (simulationCount > 0) {
      const line = d3.line()
        .x((d, i) => x(i + 1) + x.bandwidth() / 2)
        .y(d => y(d));

      svg.append("path")
        .datum(accumulatedData)
        .attr("fill", "none")
        .attr("stroke", simulationStyles.plot.secondaryColor)
        .attr("stroke-width", simulationStyles.plot.lineThickness.medium)
        .attr("d", line);
    }

    // Add axes with style
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x)
        .tickFormat(d => d));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Add y-axis label
    svg.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left - simulationStyles.spacing.margin.Extralarge)
      .attr("x", -(height / 2))
      .attr("text-anchor", "middle")
      .text("Number of Particles");

    // Add x-axis label
    svg.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height - simulationStyles.spacing.margin.small)
      .attr("text-anchor", "middle")
      .text("Compartment");

    // Add legend
    const legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("class", "legend-text")
      .attr("text-anchor", "start")
      .selectAll("g")
      .data(["Current Distribution", "Accumulated Average"])
      .join("g")
      .attr("transform", (d, i) => `translate(${margin.left},${margin.top + i * simulationStyles.spacing.margin.medium})`);

    legend.append("rect")
      .attr("x", 0)
      .attr("width", simulationStyles.spacing.margin.medium)
      .attr("height", simulationStyles.spacing.margin.medium)
      .attr("fill", (d, i) => i === 0 ? simulationStyles.plot.primaryColor : 
                              simulationStyles.plot.secondaryColor)
      .attr("opacity", (d, i) => i === 0 ? simulationStyles.plot.opacity.medium : simulationStyles.plot.opacity.full);

    legend.append("text")
      .attr("x", simulationStyles.spacing.margin.large)
      .attr("y", simulationStyles.spacing.margin.medium / 2)
      .attr("dy", "0.32em")
      .text(d => d);
  }, [distribution, accumulatedData, numParticles, numCompartments]);

  // Effect for frequency distribution visualization
  useEffect(() => {
    if (!freqSvgRef.current || particleFrequencies.length === 0) return;

    const width = 600;
    const height = 400;
    const margin = simulationStyles.chart.margin;

    // Clear previous SVG content
    d3.select(freqSvgRef.current).selectAll("*").remove();

    const svg = d3.select(freqSvgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Add title style
    svg.append("style").text(`
      .axis-label { 
        font-size: ${simulationStyles.text.axisLabel.size}; 
        fill: ${simulationStyles.text.axisLabel.color};
      }
      .legend-text { 
        font-size: ${simulationStyles.text.legend.size}; 
        fill: ${simulationStyles.text.legend.color};
      }
      .tick text { 
        font-size: ${simulationStyles.text.ticks.size}; 
        fill: ${simulationStyles.text.ticks.color};
      }
    `);

    // Calculate normalized frequencies
    const notNormalizedFreqs = accumulatedFreqSum.map(sum => 
      simulationCount > 0 ? (sum / simulationCount) / numCompartments : 0
    );
    const maxFreqx = maxPossibleParticles;
    const maxFreqy1 = Math.max(...notNormalizedFreqs); 
    const maxFreqy2 = Math.max(...analyticalDistribution); 
     
    const normalizedFreqs = notNormalizedFreqs.map(freq => freq / maxFreqy1);
    
    // Normalize analytical distribution with the same maximum
    const normalizedAnalytical = analyticalDistribution.map(freq => freq / maxFreqy2);

    // Create scales
    const x = d3.scaleLinear()
      .domain([0, maxFreqx])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, 1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Add horizontal grid lines
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y)
        .tickSize(-width + margin.left + margin.right)
        .tickFormat("")
      )
      .style("stroke-dasharray", "2,2")
      .style("stroke-opacity", 0.2);

    // Add accumulated average line
    if (simulationCount > 0) {
      const line = d3.line()
        .x((d, i) => x(i))
        .y(d => y(d))
        .curve(d3.curveCatmullRom);

      svg.append("path")
        .datum(normalizedFreqs)
        .attr("fill", "none")
        .attr("stroke", simulationStyles.plot.primaryColor)
        .attr("stroke-width", 2)
        .attr("d", line);

      // Add points to the line
      // svg.selectAll(".average-point")
      //   .data(normalizedFreqs)
      //   .join("circle")
      //   .attr("class", "average-point")
      //   .attr("cx", (d, i) => x(i))
      //   .attr("cy", d => y(d))
      //   .attr("r", 2)
      //   .attr("fill", simulationStyles.plot.primaryColor);
    }

    // Add analytical distribution line
    if (simulationCount > 0) {
      const line = d3.line()
        .x((d, i) => x(i))
        .y(d => y(d))
        .curve(d3.curveCatmullRom);

      svg.append("path")
        .datum(normalizedAnalytical)  
        .attr("fill", "none")
        .attr("stroke", simulationStyles.plot.secondaryColor)
        .attr("stroke-width", 3)
        .attr("d", line);
    }

    // Add axes with styled ticks
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(10))
      .selectAll("text")
      .style("font-size", simulationStyles.text.ticks.size)
      .style("fill", simulationStyles.text.ticks.color);

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickFormat(d3.format(".1f")))
      .selectAll("text")
      .style("font-size", simulationStyles.text.ticks.size)
      .style("fill", simulationStyles.text.ticks.color);

    // Add y-axis label with style
    svg.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left - simulationStyles.spacing.margin.Extralarge)
      .attr("x", -(height / 2))
      .attr("text-anchor", "middle")
      .text("Probability");

    // Add x-axis label with style
    svg.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height - simulationStyles.spacing.margin.small)
      .attr("text-anchor", "middle")
      .text("Number of Particles");

    // Add legend for frequency plot
    const legendData = [
      { type: 'line', label: 'Frequency Distribution', color: simulationStyles.plot.primaryColor },
      { type: 'line', label: 'Analytical Distribution', color: simulationStyles.plot.secondaryColor }
    ];

    const legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("class", "legend-text")
      .attr("text-anchor", "start")
      .selectAll("g")
      .data(legendData)
      .join("g")
      .attr("transform", (d, i) => `translate(${margin.left},${margin.top + i * simulationStyles.spacing.margin.medium})`);

    // Add legend symbols based on type
    legend.each(function(d) {
      const g = d3.select(this);
      if (d.type === 'histogram') {
        g.append("rect")
          .attr("x", 0)
          .attr("width", simulationStyles.spacing.margin.medium)
          .attr("height", simulationStyles.spacing.margin.medium)
          .attr("fill", d.color)
          .attr("opacity", simulationStyles.plot.opacity.medium);
      } else {
        g.append("line")
          .attr("x1", 0)
          .attr("x2", simulationStyles.spacing.margin.medium)
          .attr("y1", simulationStyles.spacing.margin.medium / 2)
          .attr("y2", simulationStyles.spacing.margin.medium / 2)
          .attr("stroke", d.color)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", d.label === 'Analytical Distribution' ? "5,5" : null);
      }
      
      g.append("text")
        .attr("x", simulationStyles.spacing.margin.large)
        .attr("y", simulationStyles.spacing.margin.medium / 2)
        .attr("dy", "0.32em")
        .text(d.label);
    });

    // Add the analytical distribution line
    if (analyticalDistribution.length > 0) {
      const analyticalLine = d3.line()
        .x((d, i) => x(i))
        .y(d => y(d))
        .curve(d3.curveCatmullRom);

      svg.append("path")
        .datum(normalizedAnalytical)  
        .attr("fill", "none")
        .attr("stroke", "#ff6b6b")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("d", analyticalLine);
    }
  }, [particleFrequencies, accumulatedFreqSum, simulationCount, numCompartments, analyticalDistribution]);

  // Animation loop
  useEffect(() => {
    let animationFrame;
    
    const animate = () => {
      if (isRunning) {

        simulateDistribution();
        animationFrame = requestAnimationFrame(animate);
      }
    };

    if (isRunning) {
      animate();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isRunning, numParticles, numCompartments]);

  return (
    <Container maxWidth="lg" sx={{ mt: simulationStyles.spacing.section.marginTop }}>
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{
          fontSize: simulationStyles.text.title.size,
          color: simulationStyles.text.title.color,
          mb: simulationStyles.spacing.section.marginBottom
        }}
      >
        Particle Distribution Simulation
      </Typography>
      
      <Box sx={{ mb: simulationStyles.spacing.margin.medium }}>
        <Typography 
          gutterBottom
          sx={{
            fontSize: simulationStyles.text.subtitle.size,
            color: simulationStyles.text.subtitle.color,
            mb: 1
          }}
        >
          Number of Particles: {numParticles}
        </Typography>
        <Slider
          value={numParticles}
          onChange={(_, value) => {
            setNumParticles(value);
            resetSimulation();
          }}
          min={MIN_PARTICLES}
          max={MAX_PARTICLES}
          step={PARTICLE_STEP}
          marks
          valueLabelDisplay="auto"
          sx={{ width: '100%' }}
        />
        
        <Typography 
          gutterBottom
          sx={{
            fontSize: simulationStyles.text.subtitle.size,
            color: simulationStyles.text.subtitle.color,
            mb: 1
          }}
        >
          Number of Compartments: {numCompartments}
        </Typography>
        <Slider
          value={numCompartments}
          onChange={(_, value) => {
            setNumCompartments(value);
            resetSimulation();
          }}
          min={2}
          max={20}
          step={1}
          marks
          valueLabelDisplay="auto"
          sx={{ width: '100%' }}
        />
        
        <Button 
          variant="contained" 
          onClick={() => {
            if (simulationCount >= MAX_SIMULATIONS) {
              setIsRunning(false);
              return;
            }
            setIsRunning(!isRunning);
            resetSimulation();
          }}
          sx={{ mt: 2, mr: 2 }}
        >
          {isRunning ? 'Stop' : 'Start'} Simulation
        </Button>

        <Button 
          variant="outlined" 
          onClick={resetSimulation}
          sx={{ mt: 2 }}
        >
          Reset
        </Button>

        <Typography 
          variant="body2" 
          sx={{ mt: 1 }}
        >
          Simulation Count: {simulationCount}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontSize: simulationStyles.text.subtitle.size,
              color: simulationStyles.text.subtitle.color,
              mb: 1
            }}
          >
            Particles per Compartment
          </Typography>
          <Box sx={{ width: '100%', height: 400 }}>
            <svg ref={svgRef}></svg>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontSize: simulationStyles.text.subtitle.size,
              color: simulationStyles.text.subtitle.color,
              mb: 1
            }}
          >
            Distribution of Particle Numbers
          </Typography>
          <Box sx={{ width: '100%', height: 400 }}>
            <svg ref={freqSvgRef}></svg>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ParticleDistribution;
