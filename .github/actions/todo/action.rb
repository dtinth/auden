require 'json'

def comment_on issue, message
  post_body = { body: message }
  system %(curl -X POST -H "Content-Type: application/json" -d@- "https://api.github.com/repos/$GITHUB_REPOSITORY/issues/#{issue['number']}/comments?access_token=$GITHUB_TOKEN" << 'JSON'\n#{post_body.to_json}\nJSON)
end

def close_issue issue
  system %(echo '{"state":"closed"}' | curl -X PATCH -H "Content-Type: application/json" -d@- "https://api.github.com/repos/$GITHUB_REPOSITORY/issues/#{issue['number']}?access_token=$GITHUB_TOKEN")
end

def add_label_to issue, label_name
  post_body = { labels: [label_name] }
  system %(curl -X POST -H "Content-Type: application/json" -d@- "https://api.github.com/repos/$GITHUB_REPOSITORY/issues/#{issue['number']}/labels?access_token=$GITHUB_TOKEN" << 'JSON'\n#{post_body.to_json}\nJSON)
end

todo_issues_in_code = `git grep 'TODO: #'`.scan(/TODO: #(\d+)/).map { |a| a[0].to_i }
puts "TODO markers found in code:"
p todo_issues_in_code

all_open_issues = JSON.parse `curl "https://api.github.com/repos/$GITHUB_REPOSITORY/issues?per_page=100&access_token=$GITHUB_TOKEN"`
open_issues_without_todo_label = all_open_issues.reject { |issue| issue['labels'].map { |l| l['name'] }.include? 'TODO' }
puts "Open issues without TODO label:"
p open_issues_without_todo_label.map { |issue| issue['number'] }

open_issues_without_todo_label.each do |issue|
  next unless todo_issues_in_code.include? issue['number']
  puts "Adding TODO label to ##{issue['number']}"
  add_label_to issue, "TODO"
  message = [
    "I am adding a `TODO` label to this issue because I found a TODO comment referencing this issue on the default branch. This will allow me to close the issue when that TODO comment is removed from the default branch.",
    "",
    "The commit being processed is #{ENV['GITHUB_SHA']}. [Ran on GitHub Actions.](https://github.com/#{ENV['GITHUB_REPOSITORY']}/actions/runs/#{ENV['GITHUB_RUN_ID']})",
  ].join("\n")
  comment_on issue, message
end

open_issues_with_todo_label = JSON.parse `curl "https://api.github.com/repos/$GITHUB_REPOSITORY/issues?per_page=100&labels=TODO&access_token=$GITHUB_TOKEN"`
puts "Open issues with TODO label:"
p open_issues_with_todo_label.map { |issue| issue['number'] }

open_issues_with_todo_label.each do |issue|
  next if todo_issues_in_code.include? issue['number']
  puts "Closing issue ##{issue['number']}"
  message = [
    "I am closing this issue now because these two conditions are met:",
    "",
    "- This issue has a `TODO` label.",
    "- A `TODO` comment referencing this issue no longer appears in the repository's default branch.",
    "",
    "The commit being processed is #{ENV['GITHUB_SHA']}. [Ran on GitHub Actions.](https://github.com/#{ENV['GITHUB_REPOSITORY']}/actions/runs/#{ENV['GITHUB_RUN_ID']})",
  ].join("\n")
  comment_on issue, message
  close_issue issue
end