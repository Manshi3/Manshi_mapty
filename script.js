'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance; //km
    this.duration = duration; //min
    // console.log(duration, distance, coords);
    // console.log(this.date, this.id);
  }
  setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.setDescription();
  }
  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.setDescription();
  }
  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
// const temp = new Workout([1, 2], 250, 4);
// const run1 = new Running([0, 1], 2500, 123, 5);
// const cycle1 = new Cycling([23, -15], 500, 24.5, 545);

// console.log(run1.pace);
// console.log(cycle1);
//APPLICATION ARCHITECTURE
class App {
  //Creating global private fields for this class
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    //calling this here as constructor will be called as soon as an object is created
    this._getPosition(); //to get coordinates of user
    //
    /// clicks-->form displays-->press Enter-->marker appears!
    //to create new workout form
    form.addEventListener('submit', this._newWorkout.bind(this));
    ///
    ////to toggle Elevation field
    inputType.addEventListener('change', this._toggleElevationField);
  }
  _getPosition() {
    //using geolocation API
    if (navigator.geolocation)
      //////////////////////will load map after getting coordinates////////
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () =>
        alert('Could not get location!')
      );
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 16);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');

    //clearing the input fields
    inputDuration.value =
      inputElevation.value =
      inputDistance.value =
      inputDuration.value =
        '';
  }
  _newWorkout(e) {
    e.preventDefault();
    //SMALL HELPER FUNCTION
    const isValidInputs = (...inputs) => {
      return inputs.every(el => Number.isFinite(el));
    };
    const allPositive = (...inpt) => {
      return inpt.every(el => el > 0);
    };
    //GET DATA FROM FORM

    //TYPE OF WORKOUT
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    //gets coordinates where i clicked on the map
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //IF WORKOUT RUNNING, CREATE RUNNING OBJECT
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //CHECK IF DATA IS VALID
      //GUARD PARAMETER YK
      if (
        !isValidInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert(`Please enter a valid number`);
      //CREATE RUNNING OBJECT
      workout = new Running([lat, lng], distance, duration, cadence);
      //ADD NEW OBJECT TO WORKOUT ARRAY
      this.#workouts.push(workout);
      // console.log(workout);
      // console.log(this.#workouts);
    }
    //IF WORKOUT CYCLING, CREATE CYCLING OBJECT
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      //CHECK IF DATA IS VALID
      //GUARD PARAMETER YK
      if (
        !isValidInputs(distance, duration, elevationGain) ||
        !allPositive(distance, duration, elevationGain)
      )
        return alert('Please enter a valid number');
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
      //ADD NEW OBJECT TO WORKOUT ARRAY
      this.#workouts.push(workout);
      // console.log('workout', workout);
      // console.log('workouts', this.#workouts);
    }
    //RENDER WORKOUT
    this._renderWorkout(workout);
    //RENDER WORKOUT MARKER
    this._renderWorkoutMarker(workout);
    //clearing the input fields everytime new workout is created
    this._hideForm();
  }
  //HIDE FORM + CLEAR INPUT FIELDS
  _hideForm() {
    // prettier-ignore
    inputDuration.value =inputElevation.value =inputDistance.value = inputDuration.value = inputCadence.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _renderWorkoutMarker(workout) {
    //RENDER WORKOUT ON MAP AS MARKER
    // console.log(workout.type);
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚴'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃' : '🚴'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${
        workout.type === 'running'
          ? workout.pace.toFixed(1)
          : workout.speed.toFixed()
      }</span>
      <span class="workout__unit">${
        workout.type === 'running' ? 'min/km' : 'km/hr'
      }</span>
    </div>
    `;
    if (workout.type === 'running') {
      html += `<div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    }
    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }
    // console.log(html);
    form.insertAdjacentHTML('afterend', html);
  }
}
const app = new App();
