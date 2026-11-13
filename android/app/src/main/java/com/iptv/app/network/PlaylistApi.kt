package com.iptv.app.network

import retrofit2.http.GET
import retrofit2.http.Url

/**
 * Upstream source: https://iptv-org.github.io/iptv/
 * The repository exposes grouped playlists per country and per category.
 */
interface PlaylistApi {

    /** Master index (all countries). */
    @GET("index.m3u")
    suspend fun masterPlaylist(): String

    /** All countries grouped list. */
    @GET("index.country.m3u")
    suspend fun countriesPlaylist(): String

    /** A single country playlist by code. e.g. https://iptv-org.github.io/iptv/countries/us.m3u */
    @GET
    suspend fun countryPlaylist(@Url url: String): String

    /** Categories grouped list. */
    @GET("index.category.m3u")
    suspend fun categoriesPlaylist(): String

    /** A single category playlist. e.g. https://iptv-org.github.io/iptv/categories/news.m3u */
    @GET
    suspend fun categoryPlaylist(@Url url: String): String
}
