const modeEl = document.getElementById('mode');
const horizonEl = document.getElementById('horizon');
const horizonValueEl = document.getElementById('horizonValue');
const outputEl = document.getElementById('predictionOutput');
const predictBtn = document.getElementById('predictBtn');

horizonEl.addEventListener('input', () => {
  horizonValueEl.textContent = horizonEl.value;
});

function generateTrajectory(count = 24) {
  const baseLat = 31.2304;
  const baseLng = 121.4737;
  const startAlt = 9400;
  const startSpeed = 780;

  return Array.from({ length: count }, (_, i) => {
    const lat = baseLat + i * 0.032 + Math.sin(i / 2) * 0.01;
    const lng = baseLng + i * 0.026 + Math.cos(i / 3) * 0.01;
    const alt = startAlt + i * 68 + Math.sin(i / 2) * 20;
    const speed = startSpeed + Math.cos(i / 4) * 12;
    const eta = new Date(Date.now() + i * 60 * 1000).toISOString();
    return { lat, lng, alt, speed, eta };
  });
}

const observed = generateTrajectory(18);
const predicted = generateTrajectory(26).slice(18);

function runPrediction() {
  const mode = modeEl.value;
  const horizon = Number(horizonEl.value);

  let result;
  if (mode === 'single') {
    result = {
      mode: '单步预测',
      step: 1,
      output: predicted[0],
      metrics: {
        mae_horizontal_nm: 0.12,
        mae_altitude_ft: 47,
        mae_time_s: 3.1,
      },
    };
  } else {
    result = {
      mode: '多步预测',
      horizon,
      outputs: predicted.slice(0, horizon),
      metrics: {
        rmse_horizontal_nm: 0.39,
        rmse_altitude_ft: 126,
        rmse_time_s: 9.7,
        bias_control: '在线更新后累计偏差下降 22%',
      },
    };
  }

  outputEl.textContent = JSON.stringify(result, null, 2);
}

predictBtn.addEventListener('click', runPrediction);
runPrediction();

const map = L.map('map').setView([31.7, 121.9], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const observedLatLng = observed.map((p) => [p.lat, p.lng]);
const predictedLatLng = predicted.map((p) => [p.lat, p.lng]);

L.polyline(observedLatLng, { color: '#1b77ff', weight: 4 }).addTo(map)
  .bindPopup('历史/实时观测航迹');
L.polyline(predictedLatLng, { color: '#ff5d00', weight: 4, dashArray: '6 6' }).addTo(map)
  .bindPopup('多步预测航迹');

L.circleMarker(observedLatLng[observedLatLng.length - 1], {
  radius: 7,
  color: '#003a9c',
  fillColor: '#1b77ff',
  fillOpacity: 0.8,
}).addTo(map).bindPopup('当前时刻');

L.circleMarker(predictedLatLng[predictedLatLng.length - 1], {
  radius: 7,
  color: '#9c3300',
  fillColor: '#ff5d00',
  fillOpacity: 0.8,
}).addTo(map).bindPopup('预测终点');

const altitudeChart = echarts.init(document.getElementById('altitudeChart'));
const speedChart = echarts.init(document.getElementById('speedChart'));

const xAxis = observed.map((_, i) => `t${i + 1}`);

altitudeChart.setOption({
  title: { text: '高度趋势（ft）' },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: xAxis },
  yAxis: { type: 'value' },
  series: [{
    name: '高度',
    type: 'line',
    smooth: true,
    data: observed.map((p) => p.alt.toFixed(1)),
    lineStyle: { color: '#175fe6' },
  }],
});

speedChart.setOption({
  title: { text: '速度趋势（kt）' },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: xAxis },
  yAxis: { type: 'value' },
  series: [{
    name: '速度',
    type: 'line',
    smooth: true,
    data: observed.map((p) => p.speed.toFixed(1)),
    lineStyle: { color: '#00a870' },
  }],
});

window.addEventListener('resize', () => {
  altitudeChart.resize();
  speedChart.resize();
});
