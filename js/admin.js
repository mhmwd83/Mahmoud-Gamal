document.addEventListener('DOMContentLoaded', function () {
    var dailyBody = document.querySelector('#daily-summary-table tbody');
    var locationBody = document.querySelector('#location-summary-table tbody');
    var totalDownloadsEl = document.getElementById('total-downloads');
    var totalOpensEl = document.getElementById('total-opens');
    var lastUpdatedEl = document.getElementById('last-updated');
    var dailyChart = document.getElementById('daily-summary-chart');
    var locationChart = document.getElementById('location-summary-chart');

    function getAnalyticsData() {
        var analytics = JSON.parse(localStorage.getItem('portfolio_analytics') || '[]');
        var dailySummary = {};
        var locationSummary = {
            nav_desktop: { downloads: 0, opens: 0 },
            nav_mobile: { downloads: 0, opens: 0 }
        };
        var totals = { downloads: 0, opens: 0 };

        analytics.forEach(function (entry) {
            if (entry.category !== 'CV') {
                return;
            }

            var dateKey = entry.timestamp.slice(0, 10);
            if (!dailySummary[dateKey]) {
                dailySummary[dateKey] = { downloads: 0, opens: 0 };
            }

            if (entry.action === 'click') {
                var label = entry.label || '';
                var isDownload = label.indexOf('download_cv') === 0;
                var isOpen = label.indexOf('open_cv') === 0;

                if (isDownload) {
                    dailySummary[dateKey].downloads += 1;
                    totals.downloads += 1;
                } else if (isOpen) {
                    dailySummary[dateKey].opens += 1;
                    totals.opens += 1;
                }

                if (label.indexOf('_desktop') !== -1 || label.indexOf('_mobile') !== -1) {
                    var locationKey = label.indexOf('_desktop') !== -1 ? 'nav_desktop' : 'nav_mobile';
                    if (isDownload) {
                        locationSummary[locationKey].downloads += 1;
                    } else if (isOpen) {
                        locationSummary[locationKey].opens += 1;
                    }
                }
            }
        });

        return { dailySummary: dailySummary, locationSummary: locationSummary, totals: totals };
    }

    function clearBody(body) {
        while (body.firstChild) {
            body.removeChild(body.firstChild);
        }
    }

    function drawChart(canvas, labels, datasets) {
        if (!canvas || !canvas.getContext) {
            return;
        }

        var ctx = canvas.getContext('2d');
        var width = canvas.clientWidth * window.devicePixelRatio;
        var height = canvas.clientHeight * window.devicePixelRatio;
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);

        var padding = 48 * window.devicePixelRatio;
        var labelArea = 80 * window.devicePixelRatio;
        var chartWidth = width - padding * 2;
        var chartHeight = height - padding * 2;
        var maxValue = 0;

        datasets.forEach(function (set) {
            set.data.forEach(function (value) {
                if (value > maxValue) {
                    maxValue = value;
                }
            });
        });
        maxValue = Math.max(maxValue, 1);

        var barGroupWidth = chartWidth / labels.length;
        var barWidth = Math.min(40 * window.devicePixelRatio, barGroupWidth / (datasets.length + 1));

        ctx.font = (14 * window.devicePixelRatio) + 'px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1 * window.devicePixelRatio;
        for (var y = 0; y <= 5; y += 1) {
            var yPos = padding + chartHeight - (y / 5) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding, yPos);
            ctx.lineTo(width - padding, yPos);
            ctx.stroke();

            var tickValue = Math.round((y / 5) * maxValue);
            ctx.fillText(tickValue.toString(), 10 * window.devicePixelRatio, yPos);
        }

        datasets.forEach(function (set, setIndex) {
            ctx.fillStyle = set.color;
            set.data.forEach(function (value, index) {
                var x = padding + index * barGroupWidth + setIndex * barWidth + 12 * window.devicePixelRatio;
                var barHeight = (value / maxValue) * chartHeight;
                var y = padding + chartHeight - barHeight;
                ctx.fillRect(x, y, barWidth, barHeight);
            });
        });

        labels.forEach(function (label, index) {
            var x = padding + index * barGroupWidth + barGroupWidth / 2;
            ctx.save();
            ctx.translate(x, height - padding + 16 * window.devicePixelRatio);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(label, 0, 0);
            ctx.restore();
        });
    }

    function refreshAnalytics() {
        var data = getAnalyticsData();
        clearBody(dailyBody);
        clearBody(locationBody);

        var sortedDates = Object.keys(data.dailySummary).sort();
        if (sortedDates.length === 0) {
            var emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="3">No CV analytics data found.</td>';
            dailyBody.appendChild(emptyRow);
        } else {
            sortedDates.forEach(function (dateKey) {
                var row = document.createElement('tr');
                row.innerHTML = '<td>' + dateKey + '</td>' +
                    '<td>' + data.dailySummary[dateKey].downloads + '</td>' +
                    '<td>' + data.dailySummary[dateKey].opens + '</td>';
                dailyBody.appendChild(row);
            });
        }

        Object.keys(data.locationSummary).forEach(function (locationKey) {
            var row = document.createElement('tr');
            row.innerHTML = '<td>' + locationKey + '</td>' +
                '<td>' + data.locationSummary[locationKey].downloads + '</td>' +
                '<td>' + data.locationSummary[locationKey].opens + '</td>';
            locationBody.appendChild(row);
        });

        totalDownloadsEl.textContent = data.totals.downloads;
        totalOpensEl.textContent = data.totals.opens;
        lastUpdatedEl.textContent = new Date().toLocaleTimeString();

        drawChart(dailyChart, sortedDates, [
            { data: sortedDates.map(function(date){ return data.dailySummary[date].downloads; }), color: 'rgba(37, 99, 235, 0.85)' },
            { data: sortedDates.map(function(date){ return data.dailySummary[date].opens; }), color: 'rgba(16, 185, 129, 0.85)' }
        ]);

        drawChart(locationChart, ['Desktop', 'Mobile'], [
            { data: [data.locationSummary.nav_desktop.downloads, data.locationSummary.nav_mobile.downloads], color: 'rgba(37, 99, 235, 0.85)' },
            { data: [data.locationSummary.nav_desktop.opens, data.locationSummary.nav_mobile.opens], color: 'rgba(16, 185, 129, 0.85)' }
        ]);
    }

    refreshAnalytics();
    window.addEventListener('storage', refreshAnalytics);
    setInterval(refreshAnalytics, 3000);
});
