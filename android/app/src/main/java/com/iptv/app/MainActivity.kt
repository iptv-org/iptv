package com.iptv.app

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.iptv.app.databinding.ActivityMainBinding
import com.iptv.app.network.PlaylistRepository
import com.iptv.app.ui.adapters.CountryAdapter
import com.iptv.app.ui.adapters.CategoryAdapter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.MainScope

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var scope: CoroutineScope

    private val countryAdapter = CountryAdapter { country ->
        val intent = Intent(this, ChannelListActivity::class.java).apply {
            putExtra("type", "country")
            putExtra("code", country.code)
            putExtra("title", country.name)
        }
        startActivity(intent)
    }

    private val categoryAdapter = CategoryAdapter { category ->
        val intent = Intent(this, ChannelListActivity::class.java).apply {
            putExtra("type", "category")
            putExtra("slug", category.slug)
            putExtra("title", category.name)
        }
        startActivity(intent)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        scope = MainScope()

        PlaylistRepository.init(application)

        binding.recyclerCountries.layoutManager = LinearLayoutManager(this)
        binding.recyclerCountries.adapter = countryAdapter

        binding.recyclerCategories.layoutManager = LinearLayoutManager(this)
        binding.recyclerCategories.adapter = categoryAdapter

        binding.btnFavorites.setOnClickListener {
            val intent = Intent(this, ChannelListActivity::class.java).apply {
                putExtra("type", "favorites")
                putExtra("title", getString(R.string.title_favorites))
            }
            startActivity(intent)
        }

        loadData()
    }

    private fun loadData() {
        binding.progress?.visibility = android.view.View.VISIBLE

        scope.launch {
            try {
                val countries = PlaylistRepository.fetchCountries()
                val categories = PlaylistRepository.fetchCategories()

                withContext(Dispatchers.Main) {
                    countryAdapter.submitList(countries)
                    categoryAdapter.submitList(categories)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, R.string.error_loading_playlist, Toast.LENGTH_LONG).show()
                }
            } finally {
                withContext(Dispatchers.Main) {
                    binding.progress?.visibility = android.view.View.GONE
                }
            }
        }
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_refresh -> {
                loadData()
                true
            }
            R.id.action_about -> {
                Toast.makeText(this, R.string.source_upstream, Toast.LENGTH_LONG).show()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
}
