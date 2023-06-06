import axios from "axios";
import * as $ from 'jquery';

const $showsList = $("#showsList");
const $episodesArea = $("#episodesArea");
const $searchForm = $("#searchForm");
const $episodesList = $("#episodesList");

const DEFAULT_IMAGE_URL = "https://tinyurl.com/tv-missing"
const TVMAZE_API_URL = "https://api.tvmaze.com"

interface IShow {
  id: number;
  name: string;
  summary: string;
  image: string
}

interface IShowFromApi extends Omit<IShow, "image"> {
  image: { medium: string } | null
}

interface IEpisode {
  id: number;
  name: string;
  season: number;
  number: number
}

/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
 */

async function searchShowsByTerm(term: string): Promise<IShow[]> {
  const resp = await axios.get(`${TVMAZE_API_URL}/search/shows?q=${term}`);
  const shows = resp.data;
  return shows.map((result: { show: IShowFromApi }): IShow => {
    return {
      id: result.show.id,
      name: result.show.name,
      summary: result.show.summary,
      image: result.show.image?.medium || DEFAULT_IMAGE_URL
    }
  });

}


/** Given list of shows, create markup for each and add to $showsList */

function populateShows(shows: IShow[] ): void {
  $showsList.empty();

  for (let show of shows) {
    const $show = $(
        `<div data-show-id="${show.id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
           <img
              src=${show.image}
              alt=${show.name}
              class="w-25 me-3">
           <div class="media-body">
             <h5 class="text-primary">${show.name}</h5>
             <div><small>${show.summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes">
               Episodes
             </button>
           </div>
         </div>
       </div>
      `);

    $showsList.append($show);
  }
}


/** Handle search form submission: get shows from API and display.
 *  Hide episodes area (that only gets shown if they ask for episodes)
 */

async function searchForShowAndDisplay(): Promise<void> {
  const term = $("#searchForm-term").val() as string;
  const shows = await searchShowsByTerm(term);

  $episodesArea.hide();
  populateShows(shows);
}

$searchForm.on("submit", async function (evt) {
  evt.preventDefault();
  await searchForShowAndDisplay();
});


/** Given a show ID, get from API and return (promise) array of episodes:
 *      { id, name, season, number }
 */

 async function getEpisodesOfShow(id: number): Promise<IEpisode[]> {

  const resp = await axios.get(`${TVMAZE_API_URL}/shows/${id}/episodes`);
  const episodes = resp.data;
  return episodes.map((result : IEpisode) => {
    return {
      id: result.id,
      name: result.name,
      season: result.season,
      number: result.number
    }
  });

}


/** Given list of episodes, create markup for each and add to $episodesList */

function populateEpisodes(episodes: IEpisode[]): void {
  $episodesList.empty();

  for (let episode of episodes) {
    const $episode = $(
      `<li data-episode-id=${episode.id}>
        ${episode.name} (season ${episode.season}, number${episode.number})
      </li>`
    );

  $episodesList.append($episode);
  };

}


/** Handle "Episodes" button click: get episodes from API and display.
 *  Shows episodes area.
 */

async function getEpisodesAndDisplay(id: number): Promise<void> {
  const episodes = await getEpisodesOfShow(id);

  $episodesArea.show();
  populateEpisodes(episodes);
}


$showsList.on("click", ".Show-getEpisodes", async function (evt:JQuery.ClickEvent) {
  const id = $(evt.target).closest(".Show").data("show-id");
  await getEpisodesAndDisplay(id);
});
