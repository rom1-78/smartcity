export async function getSensors() {
  return fetch("http://localhost:5000/api/sensors").then(res => res.json());
}
export async function getSensor(id: number) {
  return fetch(`http://localhost:5000/api/sensors/${id}`).then(res => res.json());
}
export async function createSensor(sensor: any) {
  return fetch("http://localhost:5000/api/sensors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sensor),
  }).then(res => res.json());
}
export async function updateSensor(id: number, sensor: any) {
  return fetch(`http://localhost:5000/api/sensors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sensor),
  }).then(res => res.json());
}
export async function deleteSensor(id: number) {
  return fetch(`http://localhost:5000/api/sensors/${id}`, {
    method: "DELETE",
  }).then(res => res.json());
}
