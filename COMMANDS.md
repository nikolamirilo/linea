`forge login`
`forge register`
`forge variables set LINEAR_CLIENT_ID eb6e9d2c01053c2cbd999546262ab755 -e development`
`forge variables set --encrypt LINEAR_CLIENT_SECRET 4129de6ea2977423fa382c99e56eb50e -e development`
`forge variables set --encrypt LINEAR_WEBHOOK_SECRET a42da7f47f5b4529463ae3bc7558b7038fd34859b1689c2e9664664670ee30f5 -e development`
`forge deploy -e development`
`forge install --upgrade`
`forge deploy -e development --verbose`
`forge uninstall -e development --site reactify-solutions.atlassian.net --product confluence`
`forge install -e development --site reactify-solutions.atlassian.net --product confluence`
`forge tunnel`