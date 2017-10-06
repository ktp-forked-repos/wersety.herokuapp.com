import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';

// Task component - represents a single todo item
export default class Task extends Component {

  deleteThisTask() {
    Meteor.call('tasks.remove', this.props.task._id);
  }

  render() {
    return (
      <li>
        <button onClick={this.deleteThisTask.bind(this)}>
          skasuj
        </button>

        <span className="text">
          {this.props.task.text}
        </span>
      </li>
    );
  }
}
