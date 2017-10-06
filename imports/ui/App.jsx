import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

// API
import { Tasks } from '../api/tasks.js';

// UI
import Task from './Task.jsx';
import AccountsUIWrapper from './AccountsUIWrapper.jsx';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      costam: 8,
    };
  }

  render() {
    return (
      <div className="container">
          <AccountsUIWrapper />

          <h1>Moja pierwsza strona w Meteorze!</h1>

            2017-10-06
            <hr/>
            Witam państwa, jestem Andrzej, mieszkam we Wrocławiu, mam 26 lat, jestem mocno wymęczony ostatnimi wydarzeniami, potrzebuję się czymś zająć, niech mi się uda ogarnąć Meteora i Reacta, będzie to dla mnie światełko w tunelu. :)
            Jestem w tym momencie bezrobotny, i nie chcę już za żadne skarby wracać do PHP, postanowiłem ogarnąć node.js, ale tyle jest w tym różnych technologii do wyboru, że to mocno przytłacza.
            Ostatecznie po długich rozważaniach skłoniłem się jednak pójść w Meteora, niech to się opłaci. Pobrałem projekt z <a href="https://www.meteor.com/tutorials/react">tutoriala</a> i spróbuję to dzisiaj rozgryźć.
            <hr/>
            Tak sobie myślę, że dobrym pomysłem było by tu opisać jak działa ten Meteor z Reactem. Chociażby dla siebie, bo jak sobie zrobię przerwę to znowu wszystko zapomnę. No ale może też i inni skorzystają później.
            <hr/>
            Na początek powiem, że polecam do tego pobrać IDE Atom, i do obsługi DB Mongo, Robo 3T. Hosting będzie na Heroku, ale to do tego jeszcze sam nie doszedłem.
            <hr/>
            W katalogu 'client' mamy 3 pliki: main.css, main.html, main.jsx. I tam nie musimy nic ruszać, to nas nie obchodzi na razie. Tam się ładuje aplikacja z imports/ui/App.jsx, i to jest dopiero to co nas interesuje.
            <hr/>
            publish, subscribe
            ...

          <form onSubmit={this.handleSubmit.bind(this)} >
            <input
              type="text"
              ref="textInput"
              placeholder="napisz coś"
            />
          </form>

        <ul>
          {this.renderTasks()}
        </ul>
      </div>
    );
  }

  handleSubmit(event) {
    event.preventDefault();

    // Find the text field via the React ref
    const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim();

    Meteor.call('tasks.insert', text);

    // Clear form
    ReactDOM.findDOMNode(this.refs.textInput).value = '';
  }

  renderTasks() {
    let filteredTasks = this.props.tasks;
    return filteredTasks.map((task) => {
      return (
        <Task
          key={task._id}
          task={task}
        />
      );
    });
  }

}

export default createContainer(() => {
  Meteor.subscribe('tasks');

  return {
    tasks: Tasks.find({}, { sort: { createdAt: -1 } }).fetch(),
    currentUser: Meteor.user(),
    wojtas: 7,
  };
}, App);
