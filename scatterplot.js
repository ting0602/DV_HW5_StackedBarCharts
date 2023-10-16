// load iris.csv
d3.csv("http://vis.lab.djosix.com:2023/data/iris.csv").then(function(data) {
    // init setting
    data = data.filter(function(d) {
        return d['class'] !== "";
    });

    const svg = d3.select("#plot")
        .attr("width", 800)
        .attr("height", 700);
    const margin = { top: 50, right: 50, bottom: 50, left: 100 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    keys = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica']

    // mapping class to color
    const color = d3.scaleOrdinal()
        .domain(data.map(d => d['class']))
        .range(["red", "green", "blue"]);

    const features = ["sepal length", "sepal width", "petal length", "petal width"];
    const cellSize = 330;
    const padding = 15; // Padding between cells
    const dotSize = 3;
    let plot = null;
    let clickedColor = null;
    let isClicked = false;

    features.forEach(function (xFeature, xIndex) {
        features.forEach(function (yFeature, yIndex) {
            const xScale = d3.scaleLinear()
                .domain([d3.min(data, d => +d[xFeature]), d3.max(data, d => +d[xFeature])])
                .range([padding, cellSize - padding]); // Include padding
            const yScale = d3.scaleLinear()
                .domain([d3.min(data, d => +d[yFeature]), d3.max(data, d => +d[yFeature])])
                .range([cellSize - padding, padding]); // Include padding
            const hist_yScale = d3.scaleLinear()
                .domain([0, data.length])
                .range([cellSize - padding, padding]); // Include padding
    
            const xAxis = d3.axisBottom(xScale);
            const yAxis = d3.axisLeft(yScale);
            const hist_yAxis = d3.axisLeft(hist_yScale);
                
            plot = svg.append("g")
                .attr("class", "plot")
                .attr("transform", `translate(${xIndex * (cellSize + padding)+50}, ${yIndex * (cellSize + padding)})`);
    
            if (xIndex === yIndex) {
                const barWidth = (cellSize - padding*2) / 10

                // mapping function
                const mapToCategory = d3.scaleQuantize()
                    .domain([d3.min(data, d => +d[xFeature]), d3.max(data, d => +d[xFeature])])
                    .range(d3.range(10));

                // init
                const categoryCounts = Array.from({ length: 10 }, () => ({
                    'Iris-setosa': 0,
                    'Iris-versicolor': 0,
                    'Iris-virginica': 0
                }));
                
                // Grouping by xFeature
                data.forEach(d => {
                    const xValue = +d[xFeature];
                    const categoryIndex = mapToCategory(xValue);
                    const className = d.class;
                    categoryCounts[categoryIndex][className]++;
                });

                const stack = d3.stack()
                .keys(keys)
                .order(d3.stackOrderNone)
                .offset(d3.stackOffsetNone);
                
                const stackedData = stack(categoryCounts);

                // barGroups
                const barGroups = plot.selectAll(".bar-group")
                    .data(stackedData)
                    .enter()
                    .append("g")
                    .attr("class", "bar-group")
                    .style("fill", d => {
                        return color(d.key);
                    });
                
                // stack
                barGroups.selectAll("rect")
                    .data(d => d)
                    .enter()
                    .append("rect")
                    .attr("x", (d, i) => (i+0.5) * barWidth)
                    .attr("y", d => hist_yScale(d[1]))
                    .attr("width", barWidth)
                    .attr("height", d => hist_yScale(d[0]) - hist_yScale(d[1]))

            } else {
                // Create a scatter plot
                plot.selectAll(".dot")
                    .data(data.filter(d => d[xFeature] != 0))
                    .enter().append("circle")
                    .attr("class", "dot")
                    .attr("cx", d => xScale(+d[xFeature]))
                    .attr("cy", d => yScale(+d[yFeature]))
                    .attr("r", dotSize)
                    .style("fill", d => color(d['class']))
                    .on("mouseover", handleMouseOver) // show up the data info
                    .on("mouseout", handleMouseOut) // fade away
                    .on("click", handleMouseClick); // click
            }
    
            // Add x-axis labels
            plot.append("text")
                .attr("class", "x-axis-label")
                .attr("x", cellSize / 2)
                .attr("y", cellSize + padding)
                .style("text-anchor", "middle")
                .text(xFeature);
    
            // Add x-axis
            plot.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0, ${cellSize - padding})`)
                .call(xAxis);

            if (xIndex !== yIndex) {
                // Add y-axis labels
                plot.append("text")
                .attr("class", "y-axis-label")
                .attr("x", -(cellSize / 2)) // Move the y-label to the left
                .attr("y", -padding)
                .style("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
                .text(yFeature);

                // Add y-axis
                plot.append("g")
                .attr("class", "y-axis")
                .attr("transform", `translate(${padding}, 0)`)
                .call(yAxis);
            } else {
                plot.append("g")
                .attr("class", "y-axis")
                .attr("transform", `translate(${padding}, 0)`)
                .call(hist_yAxis);
            }
        });
    });

    function handleMouseClick(event, d) {
        const currentColor = d3.select(this).style('fill');
        const className = d['class'];
        
        if (isClicked && clickedColor === currentColor) {
          // recover
          svg.selectAll(".dot")
            .transition()
            .duration(500)
            .style("opacity", 1)
            .attr("r", dotSize);
          clickedColor = null;
          isClicked = false;
        } else {
          // enlarge && opacity:0.5
          svg.selectAll(".dot")
            .transition()
            .duration(500)
            .style("opacity", d => d['class'] === className ? 1 : 0.5)
            .attr("r", d => d['class'] === className ? dotSize * 1.5 : dotSize);
          clickedColor = currentColor;
          isClicked = true;
        }
      }
})

// Additional Functions
// MouseOver => show info
function handleMouseOver(event, d) {
    // get info
    const sepalLength = d['sepal length'];
    const sepalWidth = d['sepal width'];
    const petalLength = d['petal length'];
    const petalWidth = d['petal width'];
    const flowerClass = d['class'];

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
        <p>Sepal Length: ${sepalLength}</p>
        <p>Sepal Width: ${sepalWidth}</p>
        <p>Petal Length: ${petalLength}</p>
        <p>Petal Width: ${petalWidth}</p>
        <p>Class: ${flowerClass}</p>
    `);

    // info box CSS
    tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");

}

// MouseOut => fade away
function handleMouseOut() {
    d3.select(".tooltip").remove();
}
