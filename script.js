d3.csv("http://vis.lab.djosix.com:2023/data/TIMES_WorldUniversityRankings_2024.csv")
    .then(function(data) {
        data = data.filter(function(d) {
            return d['rank'] !== "";
        });

        const svgWidth = 2000, svgHeight = 1100;
        const margin = {top: 35, right: 500, bottom: 700, left: 200};
        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        // init svg
        const svg = d3.select("body").append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const complete_data = data.slice(0, 1904);
        let ascending = false;
        let numSchools = 100;
        let selectedCriteria = ["scores_teaching", "scores_research", "scores_citations", "scores_industry_income", "scores_international_outlook"];
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        d3.select("#sortOrder").on("change", function() {
            ascending = document.getElementById("sortOrder").value === "ascending";
            updateChart(complete_data, ascending, numSchools, selectedCriteria);
        });

        d3.select("#schoolNum").on("input", function() {
            numSchools = Number(document.getElementById("schoolNum").value);
            updateChart(complete_data, ascending, numSchools, selectedCriteria);
        });
        d3.selectAll("input[name='criteria']").on("change", function() {
            selectedCriteria = Array.from(document.querySelectorAll("input[name='criteria']:checked")).map(input => input.value);
            updateChart(complete_data, ascending, numSchools, selectedCriteria);
        });
        
        updateChart(complete_data, ascending, numSchools, selectedCriteria);

        function updateChart(complete_data, ascending, numSchools, selectedCriteria) {
            svg.selectAll(".series").remove();
            svg.selectAll(".legend").remove();
            svg.selectAll(".x-axis").remove();
            svg.selectAll(".y-axis").remove();
            
            const data = complete_data.slice(0, numSchools);

            data.forEach(d => {
                let total = 0
                selectedCriteria.forEach(criterion => {
                    total += +d[criterion]
                });
                d.total = total
            });

            if (ascending) {
                data.sort((a, b) => d3.ascending(a.total, b.total))
            } else {
                data.sort((a, b) => d3.descending(a.total, b.total))
            }
            let stackedData = d3.stack()
                .keys(selectedCriteria)
                (data);


            const xScale = d3.scaleBand()
                .domain(data.map(d => d.name))
                .range([0, width])
                .padding(0.1);

            const yScale = d3.scaleLinear()
                .domain([0, d3.max(stackedData, d => d3.max(d, d => d[1]))])
                .range([height, 0]);

            // stack bar chart
            svg.selectAll(".series")
                .data(stackedData)
                .enter().append("g")
                    .attr("class", "series")
                    .attr("fill", (d, i) => colorScale(i))
                    .selectAll("rect")
                    .data(d => d)
                    .enter().append("rect")
                        .attr("x", (d, i) => xScale(data[i].name))
                        .attr("y", d => yScale(d[1]))
                        .attr("height", d => yScale(d[0]) - yScale(d[1]))
                        .attr("width", xScale.bandwidth())
                        .on("mouseover", handleMouseOver)
                        .on("mouseout", handleMouseOut); // fade away

            // draw x, y-axis
            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(xScale))
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("transform", "rotate(-45)");

            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(yScale).ticks(10));

            // School legend
            const legend = svg.selectAll(".legend")
                .data(selectedCriteria)
                .enter().append("g")
                    .attr("class", "legend")
                    .attr("transform", (d, i) => "translate(1350," + (20 * i) + ")");

            legend.append("rect")
                .attr("x", 0)
                .attr("width", 18)
                .attr("height", 18)
                .attr("fill", (d, i) => colorScale(i));

            legend.append("text")
                .attr("x", 25)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "start")
                .text(d => d);
        }


        function handleMouseOver(event, d) {
            // get info
            const name = d.data['name'];
            const rank = d.data['rank'];
            const scores_teaching_rank = d.data['scores_teaching_rank'];
            const scores_teaching = +d.data['scores_teaching'];
            const scores_research_rank = d.data['scores_research_rank'];
            const scores_research = +d.data['scores_research'];
            const scores_citations_rank = d.data['scores_citations_rank'];
            const scores_citations = +d.data['scores_citations'];
            const scores_industry_income_rank = d.data['scores_industry_income_rank'];
            const scores_industry_income = +d.data['scores_industry_income'];
            const scores_international_outlook_rank = d.data['scores_international_outlook_rank'];
            const scores_international_outlook = +d.data['scores_international_outlook'];
            const location = d.data['location'];

            // create info box
            const tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("background-color", "white")
                .style("border", "1px solid #ddd")
                .style("padding", "10px")
                .style("opacity", 0.9);

            // info box HTML
            tooltip.html(`
                <h3>${name}</h3>
                <p>rank: ${rank}</p>
                <p>total score: ${(scores_teaching + scores_research + scores_citations + scores_industry_income + scores_international_outlook).toFixed(1)}</p>
                <p>scores teaching rank / score: ${scores_teaching_rank} / ${scores_teaching}</p>
                <p>scores research rank / score: ${scores_research_rank} / ${scores_research}</p>
                <p>scores citations rank / score: ${scores_citations_rank} / ${scores_citations}</p>
                <p>scores industry_income rank / score: ${scores_industry_income_rank} / ${scores_industry_income}</p>
                <p>scores international_outlook rank / score: ${scores_international_outlook_rank} / ${scores_international_outlook}</p>
                <p>location: ${location}</p>
            `);

            // info box CSS
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");


            d3.select(event.currentTarget)
                .transition()
                .duration(300)
                .attr("opacity", 0.5);


            var svgBounds = svg.node().getBoundingClientRect();
            var xPosition = event.clientX - svgBounds.left - (margin.left/2);
            var yPosition = event.clientY - svgBounds.top;
            svg.append("text")
                .attr("class", "info")
                .attr("x", xPosition)
                .attr("y", yPosition - 10)
                .style("text-anchor", "start")
                .text(`${(d[1] - d[0]).toFixed(1)}`);
            console.log( event.pageX ,  event.pageY)
        }

        // MouseOut => fade away
        function handleMouseOut(event, d) {
            d3.select(".tooltip").remove();

            d3.select(event.currentTarget)
                .transition()
                .duration(300)
                .attr("opacity", 1);
            svg.selectAll(".info").remove();
        }
    });