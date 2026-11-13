package com.iptv.app.network

import android.content.Context
import com.iptv.app.models.Channel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor

const val BASE_URL = "https://iptv-org.github.io/iptv/"

object PlaylistRepository {

    private lateinit var api: PlaylistApi

    fun init(context: Context) {
        val logging = HttpLoggingInterceptor().setLevel(HttpLoggingInterceptor.Level.BASIC)
        val client = OkHttpClient.Builder()
            .addInterceptor(logging)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        api = retrofit.create(PlaylistApi::class.java)
    }

    suspend fun fetchCountries(): List<CountryInfo> = withContext(Dispatchers.IO) {
        val text = api.countriesPlaylist()
        parseCountryIndex(text)
    }

    suspend fun fetchCategories(): List<CategoryInfo> = withContext(Dispatchers.IO) {
        val text = api.categoriesPlaylist()
        parseCategoryIndex(text)
    }

    suspend fun fetchCountryPlaylist(code: String): List<Channel> = withContext(Dispatchers.IO) {
        val url = "$BASE_URL/countries/$code.m3u"
        val text = api.countryPlaylist(url)
        M3UParser.parse(text, defaultCountry = code.uppercase())
    }

    suspend fun fetchCategoryPlaylist(slug: String): List<Channel> = withContext(Dispatchers.IO) {
        val url = "$BASE_URL/categories/$slug.m3u"
        val text = api.categoryPlaylist(url)
        M3UParser.parse(text, defaultCategory = slug)
    }

    suspend fun fetchAllChannels(): List<Channel> = withContext(Dispatchers.IO) {
        val text = api.masterPlaylist()
        M3UParser.parse(text)
    }

    /* ---------- index parsing helpers ---------- */

    private fun parseCountryIndex(text: String): List<CountryInfo> {
        // index.country.m3u entries: title = "🇦🇫 Afghanistan", url = "countries/af.m3u"
        val channels = M3UParser.parse(text)
        return channels.map { ch ->
            val code = extractCodeFromUrl(ch.url)
            val name = ch.title.removePrefix(Regex("\uD83C[\uDDE6-\uDDFF]{2}")).trim()
            CountryInfo(code = code, name = name, channelCount = -1)
        }.filter { it.code.isNotEmpty() }
         .distinctBy { it.code }
         .sortedBy { it.name }
    }

    private fun extractCodeFromUrl(url: String): String {
        // url like "https://iptv-org.github.io/iptv/countries/af.m3u"
        val file = url.substringAfterLast('/').removeSuffix(".m3u")
        return if (file.length == 2) file else ""
    }

    private fun parseCategoryIndex(text: String): List<CategoryInfo> {
        val channels = M3UParser.parse(text)
        return channels.map { ch ->
            CategoryInfo(slug = ch.groupTitle, name = ch.title, channelCount = -1)
        }.distinctBy { it.slug }.sortedBy { it.name }
    }

    private fun extractCode(title: String): String {
        val regex = Regex("\\(([A-Za-z]{2})\\)")
        return regex.find(title)?.groupValues?.get(1) ?: title.take(2).uppercase()
    }
}

data class CountryInfo(val code: String, val name: String, val channelCount: Int)
data class CategoryInfo(val slug: String, val name: String, val channelCount: Int)
