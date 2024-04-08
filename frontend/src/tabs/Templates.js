import React from 'react'
import './Templates.css';
import ExpandableTab from './ExpandableTab.js';

const TemplatesMainSection = props => {
  return (
    <div className="Templates__main">
      <h2 className="Templates__header">Mine / Events</h2>
      <div className="Templates__container">
        <div className="Template" style={{margin: '10px', padding: '90px', backgroundColor: 'red'}}></div>
        <div className="Template" style={{margin: '10px', padding: '90px', backgroundColor: 'blue'}}></div>
        <div className="Template" style={{margin: '10px', padding: '90px', backgroundColor: 'green'}}></div>
        <div className="Template" style={{margin: '10px', padding: '90px', backgroundColor: 'yellow'}}></div>
        <div className="Template" style={{margin: '10px', padding: '90px', backgroundColor: 'purple'}}></div>
        <div className="Template" style={{margin: '10px', padding: '90px', backgroundColor: 'orange'}}></div>
      </div>
    </div>
  );
}

const TemplatesExpandedSection = props => {
  return (
    <div className="Templates__all">
      <h2 className="Templates__header">All Templates</h2>
      <div className="Templates__all__grid">
        <div className="Templates__all__item">1</div>
        <div className="Templates__all__item">2</div>
        <div className="Templates__all__item">3</div>
        <div className="Templates__all__item">4</div>
        <div className="Templates__all__item">5</div>
        <div className="Templates__all__item">6</div>
        <div className="Templates__all__item">7</div>
        <div className="Templates__all__item">8</div>
        <div className="Templates__all__item">9</div>
        <div className="Templates__all__item">10</div>
        <div className="Templates__all__item">11</div>
        <div className="Templates__all__item">12</div>
        <div className="Templates__all__item">13</div>
        <div className="Templates__all__item">14</div>
        <div className="Templates__all__item">15</div>
        <div className="Templates__all__item">16</div>
        <div className="Templates__all__item">17</div>
        <div className="Templates__all__item">18</div>
        <div className="Templates__all__item">19</div>
        <div className="Templates__all__item">20</div>
      </div>
    </div>
  );
}

const Templates = props => {
  return (
    <ExpandableTab title="Templates" mainSection={TemplatesMainSection} expandedSection={TemplatesExpandedSection} />
  );
}

export default Templates;
