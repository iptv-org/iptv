package com.iptv.app

import android.content.Intent
import android.os.Bundle
import android.view.MenuItem
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.iptv.app.databinding.ActivityChannelListBinding
import com.iptv.app.models.Channel
import com.iptv.app.models.FavoriteChannel
import com.iptv.app.network.PlaylistRepository
import com.iptv.app.ui.adapters.ChannelAdapter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.MainScope

class ChannelListActivity : AppCompatActivity() {

    private lateinit var binding: ActivityChannelListBinding
    private lateinit var scope: CoroutineScope

    /** Locally cached favorite URLs for synchronous lookup in the adapter. */
    private val favoriteUrls = mutableSetOf<String>()

    private val channelAdapter = ChannelAdapter(
        onChannelClick = { channel ->
            val intent = Intent(this@ChannelListActivity, PlayerActivity::class.java).apply {
                putExtra("channel_title", channel.title)
                putExtra("channel_url", channel.url)
            }
            startActivity(intent)
        },
        onFavoriteToggle = { channel, favView ->
            toggleFavorite(channel, favView)
        },
        isFavorite = { url -> favoriteUrls.contains(url) }
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChannelListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = intent.getStringExtra("title") ?: getString(R.string.title_channels)

        scope = MainScope()

        binding.recyclerChannels.layoutManager = LinearLayoutManager(this)
        binding.recyclerChannels.adapter = channelAdapter

        binding.swipeRefresh.setOnRefreshListener {
            currentFetch?.let { loadChannels(it) }
        }

        loadFavoriteUrls()

        val type = intent.getStringExtra("type") ?: "country"
        when (type) {
            "country" -> {
                val code = intent.getStringExtra("code") ?: ""
                currentFetch = { PlaylistRepository.fetchCountryPlaylist(code) }
                loadChannels(currentFetch!!)
            }
            "category" -> {
                val slug = intent.getStringExtra("slug") ?: ""
                currentFetch = { PlaylistRepository.fetchCategoryPlaylist(slug) }
                loadChannels(currentFetch!!)
            }
            "favorites" -> {
                binding.searchView.visibility = android.view.View.GONE
                loadFavorites()
            }
        }
    }

    /** Load favorite URLs from Room into the local cache. */
    private fun loadFavoriteUrls() {
        scope.launch {
            try {
                val favs = App.database.favoriteDao().getAll().first()
                withContext(Dispatchers.Main) {
                    favoriteUrls.clear()
                    favoriteUrls.addAll(favs.map { it.url })
                }
            } catch (e: Exception) {
                // Ignore — favorites will simply appear empty until DB is ready
            }
        }
    }

    private fun loadChannels(fetch: suspend () -> List<Channel>) {
        binding.swipeRefresh.isRefreshing = true
        binding.emptyState.visibility = android.view.View.GONE
        binding.progress.visibility = android.view.View.VISIBLE

        scope.launch {
            try {
                val list = fetch()
                withContext(Dispatchers.Main) {
                    binding.swipeRefresh.isRefreshing = false
                    binding.progress.visibility = android.view.View.GONE
                    if (list.isEmpty()) {
                        binding.emptyState.visibility = android.view.View.VISIBLE
                    } else {
                        channelAdapter.submitList(list)
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.swipeRefresh.isRefreshing = false
                    binding.progress.visibility = android.view.View.GONE
                    binding.emptyState.visibility = android.view.View.VISIBLE
                    Toast.makeText(this@ChannelListActivity, R.string.error_loading_playlist, Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun loadFavorites() {
        binding.progress.visibility = android.view.View.VISIBLE
        scope.launch {
            try {
                val favs = App.database.favoriteDao().getAll().first()
                val channels = favs.map { it.toChannel() }
                withContext(Dispatchers.Main) {
                    binding.progress.visibility = android.view.View.GONE
                    if (channels.isEmpty()) {
                        binding.emptyState.visibility = android.view.View.VISIBLE
                    } else {
                        channelAdapter.submitList(channels)
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.progress.visibility = android.view.View.GONE
                    Toast.makeText(this@ChannelListActivity, R.string.network_error, Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun toggleFavorite(channel: Channel, favView: android.widget.ImageView) {
        scope.launch {
            try {
                val currently = favoriteUrls.contains(channel.url)
                withContext(Dispatchers.Main) {
                    if (currently) {
                        // Remove
                        App.database.favoriteDao().deleteByUrl(channel.url)
                        favoriteUrls.remove(channel.url)
                        favView.setImageResource(R.drawable.ic_star_outline)
                        channelAdapter.notifyDataSetChanged()
                        Toast.makeText(this@ChannelListActivity, "حذف شد از علاقه‌مندی‌ها", Toast.LENGTH_SHORT).show()
                    } else {
                        // Add
                        App.database.favoriteDao().insert(
                            FavoriteChannel(
                                url = channel.url,
                                title = channel.title,
                                groupTitle = channel.groupTitle,
                                countryCode = channel.countryCode,
                                category = channel.category
                            )
                        )
                        favoriteUrls.add(channel.url)
                        favView.setImageResource(R.drawable.ic_star)
                        channelAdapter.notifyDataSetChanged()
                        Toast.makeText(this@ChannelListActivity, "افزودن به علاقه‌مندی‌ها", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@ChannelListActivity, R.string.network_error, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    /** The currently-active fetch block, so swipe-to-refresh re-fetches the same source. */
    private var currentFetch: (suspend () -> List<Channel>)? = null

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            android.R.id.home -> {
                onBackPressed()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
}
