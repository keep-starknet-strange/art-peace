import React from 'react'
import './NFTs.css';
import ExpandableTab from './ExpandableTab.js';

const NFTsMainSection = props => {
  return (
    <div className="NFTs__main">
      <h2 className="NFTs__header">My Collection</h2>
      <div className="NFTs__container">
        <div className="NFT" style={{margin: '10px', padding: '90px', backgroundColor: 'red'}}></div>
        <div className="NFT" style={{margin: '10px', padding: '90px', backgroundColor: 'blue'}}></div>
        <div className="NFT" style={{margin: '10px', padding: '90px', backgroundColor: 'green'}}></div>
        <div className="NFT" style={{margin: '10px', padding: '90px', backgroundColor: 'yellow'}}></div>
        <div className="NFT" style={{margin: '10px', padding: '90px', backgroundColor: 'purple'}}></div>
        <div className="NFT" style={{margin: '10px', padding: '90px', backgroundColor: 'orange'}}></div>
      </div>
    </div>
  );
}

const NFTsExpandedSection = props => {
  return (
    <div className="NFTs__marketplace">
      <h2 className="NFTs__header">Marketplace</h2>
      <div className="NFTs__marketplace__grid">
        <div className="NFTs__marketplace__item">1</div>
        <div className="NFTs__marketplace__item">2</div>
        <div className="NFTs__marketplace__item">3</div>
        <div className="NFTs__marketplace__item">4</div>
        <div className="NFTs__marketplace__item">5</div>
        <div className="NFTs__marketplace__item">6</div>
        <div className="NFTs__marketplace__item">7</div>
        <div className="NFTs__marketplace__item">8</div>
        <div className="NFTs__marketplace__item">9</div>
        <div className="NFTs__marketplace__item">10</div>
        <div className="NFTs__marketplace__item">11</div>
        <div className="NFTs__marketplace__item">12</div>
        <div className="NFTs__marketplace__item">13</div>
        <div className="NFTs__marketplace__item">14</div>
        <div className="NFTs__marketplace__item">15</div>
        <div className="NFTs__marketplace__item">16</div>
        <div className="NFTs__marketplace__item">17</div>
        <div className="NFTs__marketplace__item">18</div>
        <div className="NFTs__marketplace__item">19</div>
        <div className="NFTs__marketplace__item">20</div>
      </div>
    </div>
  );
}

const NFTs = props => {
  // TODO: Properties to NFTs main container
  // TODO: Properties like : position, template?, ...
  return (
    <ExpandableTab title="NFTs" mainSection={NFTsMainSection} expandedSection={NFTsExpandedSection} />
  );
}

export default NFTs;
