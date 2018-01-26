import React, {Component} from 'react';
import {ReactDOM, findDOMNode} from 'react-dom';
import Random from './Random.jsx';
import {Meteor} from 'meteor/meteor';

export default class Window extends Component {

  constructor(props) {
    super(props);
    this.state = {
      newline: true,
      previous: [this.props.params]
    };
  }

  render() {

    // zapytanie o wersety
    let params = this.props.params;

    return (

      <div key="window" className="window">

        {/* formularz wyboru wersetow */}
        <form>

          {/* przekład */}
          <select onChange={() => {
            this.changeVerse();
          }} ref={"translations"} value={params.t} required>

            {/* wszystkie tłumaczenia na raz */}
            <option key={0} value={0}>Porównanie przekładów</option>
            {/* lista przekładów */}
            {this.props.translations.map(translation => <option key={translation._id} value={translation._id}>{translation.name}</option>)
}

          </select>

          {/* księga */}
          <select onChange={() => {
            this.changeVerse();
          }} ref={"books"} value={params.b} required>

            {this.props.books.map(book => <option key={book._id} value={book._id}>{book.name_pl}</option>)
}

          </select>

          {/* rozdział */}
          <select onChange={() => {
            this.changeVerse();
          }} ref={"chapters"} className="chaptersSelect" value={params.c} required>

            {_.range(1, this.props.books[params.b - 1].chapters + 1).map(value => <option key={value} value={value}>{value}</option>)
}

          </select>

          {/* werset */}
          <select onChange={() => {
            this.changeVerse();
          }} ref={"verses"} className="versesSelect" value={params.v} required>

            {/* cały rozdział */}
            {params.t > 0 && <option key={0} value={0}>~</option>
}
            {/* lista wersetów */}
            {_.range(1, this.props.books[params.b - 1].verses[params.c - 1] + 1).map(value => <option key={value} value={value}>{':'}{value}</option>)
}

          </select>

          {/* werset */}
          <select onChange={() => {
            this.changeVerse();
          }} ref={"verses2"} className="verses2Select" value={params.v2} required>
            <option key={0} value={0}>~</option>
            {/* lista wersetów */}
            {_.range(params.v + 1, this.props.books[params.b - 1].verses[params.c - 1] + 1).map(value => <option key={value} value={value}>{'-'}{value}</option>)
}
            {this.props.books[params.b - 1].verses[params.c] && _.range(1, this.props.books[params.b - 1].verses[params.c] + 1).map(value => <option key={- value} value={- value}>{'-'}{params.c + 1}{':'}{value}</option>)
}

          </select>

          <button type="button" className="black" onClick={() => {
            this.first();
          }}>
            <i className="fa fa-backward"></i>
          </button>

          <button type="button" className="black" onClick={() => {
            this.previous();
          }}>
            <i className="fa fa-step-backward"></i>
          </button>

          <button type="button" className="black" onClick={() => {
            this.next();
          }}>
            <i className="fa fa-step-forward"></i>
          </button>

          <button type="button" className="black" onClick={() => {
            this.last();
          }}>
            <i className="fa fa-forward"></i>
          </button>

          <button type="button" className="black" onClick={() => {
            this.random();
          }}>
            <i className="fa fa-question"></i>
          </button>

          <button type="button" className="black" onClick={() => {
            this.undo();
          }}>
            <i className="fa fa-undo"></i>
          </button>

          {/* cofnij */}
          <select onChange={() => {
            this.loadPrevious();
          }} ref={"undo"} className="undoSelect" value={0} required>

            {this.state.previous.map((params, index) => <option key={index} value={index}>
              {params.t
                ? this.props.translations[params.t - 1].shortname + ' '
                : ''}{this.props.books[params.b - 1].abbv}{' '}{params.c}{params.v
                ? ':' + params.v
                : ''} {params.v2 > 0 && '-' + params.v2
}
              {params.v2 < 0 && '-' + (params.c + 1) + ':' + (-params.v2)
}
            </option>)
}

          </select>

          <button type="button" className="black" onClick={() => {
            this.setState({
              newline: !this.state.newline
            });
          }}>
            <i className={this.state.newline
              ? "fa fa-list-ol"
              : "fa fa-align-justify"}></i>
          </button>

          <button type="button" className="red right" onClick={() => {
            let windows = Session.get('windows');
            windows.splice(this.props.index, 1);
            Session.set('windows', windows);
          }}>
            <i className="fa fa-remove"></i>
          </button>

        </form>

        <div ref={"content"} className={"verses" + (this.state.newline
          ? " newline"
          : "")}>

          {this.props.verses.map((verse, index) => {
            let bname = true;
            if (index > 0 && verse.t == this.props.verses[index - 1].t) {
              bname = false;
            }
            return this.renderVerse(verse, bname);
          })}

        </div>

      </div>

    );

  }

  // renderuj werset
  renderVerse(verse, bname = false) {

    let admin = this.props.admin;

    let lang = this.props.translations[verse.t - 1].lang;
    switch(lang) {
        case 'en':
            lang = 'gb';
            break;
        case 'uk':
            lang = 'ua';
            break;
        case 'cs':
            lang = 'cz';
            break;
        case 'el':
            lang = 'gr';
            break;
    }

    return <span className="verse" key={verse._id}>
      {bname && <div className="translationName">
        <span className={"flag-icon flag-icon-squared flag-icon-" + lang}></span>
        <span>
          {this.props.translations[verse.t - 1].name}
        </span>
      </div>
      }

      {admin && <form>
        <button type="button" className="green" onClick={() => {
          this.insertVerse(verse.t, verse.b, verse.c, verse.v, this.props.verses);
        }}>
          <i className="fa fa-plus"></i>
        </button>
        <button type="button" className="red" onClick={() => {
          this.removeVerse(verse.t, verse.b, verse.c, verse.v, this.props.verses);
        }}>
          <i className="fa fa-remove"></i>
        </button>
        {verse.v > 1 && <button type="button" onClick={() => {
          this.joinVerse(verse.t, verse.b, verse.c, verse.v, verse.x, this.props.verses);
        }}>
          <i className="fa fa-level-up"></i>
        </button>
        }
        <button type="button" className="blue" onClick={() => {
          this.shiftbackVerse(verse.t, verse.b, verse.c, verse.v);
        }}>
          <i className="fa fa-arrow-left"></i>
        </button>
        <button type="button" className="blue" onClick={() => {
          this.shiftVerse(verse.t, verse.b, verse.c, verse.v);
        }}>
          <i className="fa fa-arrow-right"></i>
        </button>
      </form>
      }

      <span className="verseLocation">

        {' '}{verse.c}: {verse.v}{' '}

      </span>

      {admin && <form className="editVerse">
        <textarea value={verse.x} onChange={(event) => {
          this.updateVerse(verse.t, verse.b, verse.c, verse.v, event.target.value);
        }}></textarea>
      </form>
      }

      {!admin && verse.x}

    </span>;
  }

  // zmien wyswietlane wersety
  changeVerse(translation = undefined, book = undefined, chapter = undefined, verse = undefined, verse2 = undefined) {

    let index = this.props.index;

    // zrobić to sprawdzanie typów bardziej elegancko później
    if (translation === undefined) {
      translation = Number(findDOMNode(this.refs['translations']).value);
    }
    if (book === undefined) {
      book = Number(findDOMNode(this.refs['books']).value);
    }
    if (chapter === undefined) {
      chapter = Number(findDOMNode(this.refs['chapters']).value);
    }
    if (verse === undefined) {
      verse = Number(findDOMNode(this.refs['verses']).value);
    }
    if (verse2 === undefined) {
      verse2 = Number(findDOMNode(this.refs['verses2']).value);
    }

    let books = this.props.books;

    if (verse == 0 && translation == 0) {
      verse = 1;
      verse2 = 0;
    }

    // jak nie ma takiego rozdziału to na początek lecimy
    if (chapter > books[book - 1].chapters) {
      chapter = 1;
      verse2 = 0;
      if (verse > 0) {
        verse = 1;
      }
    }

    // jak nie ma takiego wersetu to na początek lecimy
    if (verse > books[book - 1].verses[chapter - 1]) {
      verse = 1;
      verse2 = 1;
    }

    if (verse2 < 0 && chapter + 1 > books[book - 1].chapters) {
      verse2 = 0;
    }

    if (verse2 > 0 && (-verse2) > books[book - 1].verses[chapter]) {
      verse2 = 0;
    }

    let windows = Session.get('windows');
    let params = new Object;

    params.t = translation;
    params.b = book;
    params.c = chapter;
    params.v = verse;
    params.v2 = verse2;

    windows[index] = params;

    Session.set('windows', windows);

    // jeśli to zestawienie tłumaczeń lub psalmy to wyświetl wersety w nowych liniach
    this.setState({
      newline: translation == 0 || book == 19
    });

    this.setPrevious(windows[index]);

  }

  setPrevious(params) {
    this.setState({
      previous: [
        params, ...this.state.previous
      ].slice(0, 10)
    });
  }

  previous() {

    let windows = Session.get('windows');
    let index = this.props.index;
    let params = this.props.params;
    let books = this.props.books;

    if (params.v > 0) {
      if (params.v > 1) {
        windows[index].v = params.v - 1;
      } else if (params.c > 1) {
        windows[index].v = books[params.b - 1].verses[params.c - 2];
        windows[index].c = params.c - 1;
      }
    } else if (params.c > 1) {
      windows[index].c = params.c - 1;
    }
    windows[index].v2 = 0;
    Session.set('windows', windows);

    this.setPrevious(windows[index]);

  }

  next() {

    let windows = Session.get('windows');
    let index = this.props.index;
    let params = this.props.params;
    let books = this.props.books;

    if (params.v > 0) {
      // jeśli jest werset ustawiony
      if (params.v < books[params.b - 1].verses[params.c - 1]) {
        windows[index].v = params.v + 1;
      } else if (params.c < books[params.b - 1].chapters) {
        windows[index].v = 1;
        windows[index].c = params.c + 1;
      }
    } else if (params.c < books[params.b - 1].chapters) {
      // jeśli nie ma wersetu ustawionego
      windows[index].c = params.c + 1;
    }
    windows[index].v2 = 0;
    Session.set('windows', windows);

    this.setPrevious(windows[index]);

  }

  first() {

    let windows = Session.get('windows');
    let index = this.props.index;
    let params = this.props.params;
    let books = this.props.books;

    if (params.v > 1) {
      windows[index].v = 1;
    } else {
      windows[index].c = 1;
    }
    windows[index].v2 = 0;
    Session.set('windows', windows);

    this.setPrevious(windows[index]);

  }

  last() {

    let windows = Session.get('windows');
    let index = this.props.index;
    let params = this.props.params;
    let books = this.props.books;

    if (params.v > 0 && params.v < books[params.b - 1].verses[params.c - 1]) {
      // jeśli jest nieostatni werset ustawiony
      // to ustawiamy nieostaty
      windows[index].v = books[params.b - 1].verses[params.c - 1];
    } else if (params.c == books[params.b - 1].chapters) {
      // jeśli jesteśmy już w ostatnim rozdziale
      // to ustawiamy ostatni werset
      if (params.v > 0) {
        params.v = books[params.b - 1].verses[params.c - 1];
      }
    } else {
      // jeśli nie ma wersetu lub jest ostatni
      // to rozdział ostatni ustawiamy
      windows[index].c = books[params.b - 1].chapters;
      if (params.v > 0) {
        // jeśli jest werset ustawiony
        windows[index].v = 1;
      }
    }
    windows[index].v2 = 0;
    Session.set('windows', windows);

    this.setPrevious(windows[index]);

  }

  undo() {
    let previous = this.state.previous;
    this.changeVerse(previous[1].t, previous[1].b, previous[1].c, previous[1].v, previous[1].v2);
    this.setState({
      previous: [
        ...previous.slice(1),
        previous[0]
      ]
    });
  }

  loadPrevious() {
    let params = this.state.previous[Number(findDOMNode(this.refs['undo']).value)];
    if (params.t === undefined) {
      params.t = 0;
    }
    if (params.v === undefined) {
      params.v = 0;
    }
    this.changeVerse(params.t, params.b, params.c, params.v, params.v2);
  }

  random() {
    let verse = Random.allverses[Math.floor(Math.random() * 31102)];
    this.changeVerse(undefined, verse.b, verse.c, verse.v, 0);
  }

  // tu się zaczynają funkcje do edycji wersetów (dostępne tylko dla admina)
  insertVerse(t, b, c, v, verses)
  {
    Meteor.call('verses.insert', t, b, c, v, verses);
  }

  removeVerse(t, b, c, v, verses)
  {
    Meteor.call('verses.remove', t, b, c, v, verses);
  }

  joinVerse(t, b, c, v, x, verses)
  {
    Meteor.call('verses.update', (t + '.' + b + '.' + c + '.' + (v - 1)), (verses[v - 2].x + ' ' + x));
    Meteor.call('verses.remove', t, b, c, v, verses);
  }

  updateVerse(t, b, c, v, x)
  {
    Meteor.call('verses.update', (t + '.' + b + '.' + c + '.' + v), x);
  }

  shiftVerse(t, b, c, v)
  {
    Meteor.call('verses.shift', t, b, c, v);
  }

  shiftbackVerse(t, b, c, v)
  {
    Meteor.call('verses.shiftback', t, b, c, v);
  }

}
