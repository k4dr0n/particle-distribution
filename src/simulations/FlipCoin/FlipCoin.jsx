import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, Container, Grid } from '@mui/material';
import * as d3 from 'd3';
import { simulationStyles } from '../../styles/simulationStyles';

const FlipCoin = () => {
    const [cycles, setCycles] = useState(1000);
    const [headProbabilities, setHeadProbabilities] = useState([]);
    const [tailProbabilities, setTailProbabilities] = useState([]);
    const [headCounts, setHeadCounts] = useState(new Array(101).fill(0));
    const svgRefProb = useRef();
    const svgRefHist = useRef();
    const [isAnimating, setIsAnimating] = useState(false);
    const [intervalId, setIntervalId] = useState(null);

    const flipCoin = () => {
        const headsPerCycle = [];
        let cumulativeHeads = 0;
        let cumulativeTails = 0;
        const headProbs = [];
        const tailProbs = [];

        for (let cycle = 0; cycle < cycles; cycle++) {
            let heads = 0;
            for (let i = 0; i < 100; i++) {
                if (Math.random() < 0.5) heads++;
            }
            headsPerCycle.push(heads);
            cumulativeHeads += heads;
            cumulativeTails += 100 - heads;

            headProbs.push(cumulativeHeads / ((cycle + 1) * 100));
            tailProbs.push(cumulativeTails / ((cycle + 1) * 100));
        }

        const newHeadCounts = new Array(101).fill(0);
        headsPerCycle.forEach(count => {
            newHeadCounts[count]++;
        });

        setHeadProbabilities(headProbs);
        setTailProbabilities(tailProbs);
        setHeadCounts(newHeadCounts);
    };

    const animateSimulation = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        let currentCycle = 100;
        const interval = setInterval(() => {
            if (!isAnimating || currentCycle > 10000) {
                clearInterval(interval);
                setIsAnimating(false);
                return;
            }
            setCycles(currentCycle);
            flipCoin();
            currentCycle += 100;
        }, 500); // Update every 500ms

        setIntervalId(interval);
        return () => clearInterval(interval); // Clear interval on unmount
    };

    const stopAnimation = () => {
        setIsAnimating(false);
        clearInterval(intervalId);
    };

    useEffect(() => {
        if (!svgRefProb.current || !svgRefHist.current) return;

        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };

        const svgProb = d3.select(svgRefProb.current)
            .attr('width', width)
            .attr('height', height)
            .style('background', simulationStyles.background.primary);

        svgProb.selectAll('*').remove();

        const xProb = d3.scaleLinear()
            .domain([0, cycles])
            .range([margin.left, width - margin.right]);

        const yProb = d3.scaleLinear()
            .domain([0.4, 0.6])
            .range([height - margin.bottom, margin.top]);

        const lineProb = d3.line()
            .x((d, i) => xProb(i))
            .y(d => yProb(d));

        svgProb.append('path')
            .datum(headProbabilities)
            .attr('fill', 'none')
            .attr('stroke', simulationStyles.plot.primaryColor)
            .attr('stroke-width', 2)
            .attr('d', lineProb);

        svgProb.append('path')
            .datum(tailProbabilities)
            .attr('fill', 'none')
            .attr('stroke', simulationStyles.plot.secondaryColor)
            .attr('stroke-width', 2)
            .attr('d', lineProb);

        svgProb.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(xProb).ticks(10));

        svgProb.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(yProb));

        svgProb.append('text')
            .attr('class', 'axis-label')
            .attr('x', width / 2)
            .attr('y', height - margin.bottom / 2)
            .attr('text-anchor', 'middle')
            .text('Number of Cycles');

        svgProb.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', margin.left / 2)
            .attr('x', -height / 2)
            .attr('text-anchor', 'middle')
            .text('Probability');

        const svgHist = d3.select(svgRefHist.current)
            .attr('width', width)
            .attr('height', height)
            .style('background', simulationStyles.background.primary);

        svgHist.selectAll('*').remove();

        const xHist = d3.scaleBand()
            .domain(d3.range(0, 101))
            .range([margin.left, width - margin.right])
            .padding(0.1);

        const yHist = d3.scaleLinear()
            .domain([0, d3.max(headCounts)]) 
            .range([height - margin.bottom, margin.top]);

        svgHist.selectAll('rect')
            .data(headCounts)
            .join('rect')
            .attr('x', (d, i) => xHist(i))
            .attr('y', d => yHist(d))
            .attr('height', d => yHist(0) - yHist(d))
            .attr('width', xHist.bandwidth())
            .attr('fill', simulationStyles.plot.primaryColor)
            .attr('opacity', simulationStyles.plot.opacity.medium);

        svgHist.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(xHist).tickValues(d3.range(0, 101, 10))); 

        svgHist.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(yHist));

        svgHist.append('text')
            .attr('class', 'axis-label')
            .attr('x', width / 2)
            .attr('y', height - margin.bottom / 2)
            .attr('text-anchor', 'middle')
            .text('Number of Heads (per 100 flips)');

        svgHist.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', margin.left / 2)
            .attr('x', -height / 2)
            .attr('text-anchor', 'middle')
            .text('Frequency');

    }, [headProbabilities, tailProbabilities, headCounts, cycles]);

    return (
        <Container maxWidth="md" sx={{ mt: simulationStyles.spacing.section.marginTop }}>
            <Typography variant="h4" gutterBottom sx={{ color: simulationStyles.text.title.color }}>
                Flip a Coin (100 flips per cycle)
            </Typography>
            <Grid container spacing={3} direction="column">
                <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                        <Typography gutterBottom>
                            Cycles: {cycles} / 10000
                        </Typography>
                    </Box>
                    <Button variant="contained" onClick={isAnimating ? stopAnimation : animateSimulation} sx={{ mb: 2 }}>
                        {isAnimating ? 'Stop Animation' : 'Start Animation'}
                    </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                    <svg ref={svgRefProb} width={600} height={400}></svg>
                </Grid>
                <Grid item xs={12} md={6}>
                    <svg ref={svgRefHist} width={600} height={400}></svg>
                </Grid>
            </Grid>
        </Container>
    );
};

export default FlipCoin;
